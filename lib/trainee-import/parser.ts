import "server-only"

import { createHash } from "node:crypto"
import { load, type CheerioAPI } from "cheerio"
import { inferCompensation, inferDuration, inferTraineeFields } from "./classify"
import { extractTraineeOpportunityId } from "./dedupe"
import { fetchApprovedTraineeSourceText } from "./fetch"
import type { TraineeImportCandidate, TraineeImportSourceDefinition } from "./types"

type DiscoveredProgram = {
  url: string
  externalId?: string
  title?: string
  company?: string
  location?: string
  deadline?: string
  publishedAt?: string | null
  salary?: string
  bodyText?: string
  metadata?: Record<string, unknown>
}

type JsonLdJobPosting = Record<string, unknown> & {
  title?: string
  description?: string
  datePosted?: string
  validThrough?: string
  employmentType?: string | string[]
  hiringOrganization?: Record<string, unknown>
  jobLocation?: Record<string, unknown> | Array<Record<string, unknown>>
  baseSalary?: unknown
}

const DETAIL_CONCURRENCY = 5
const PROGRAM_TITLE_PATTERN = /\b(?:trainee|graduate\s+(?:(?:training|development|leadership|management|insight|recruitment|audit|analyst|commercial|engineering|technology|finance|sourcing)\s+)*(?:scheme|program|programme)|graduate\s+trainee|management\s+trainee|early\s+career\s+(?:program|programme)|future\s+talent\s+(?:program|programme)|development\s+(?:program|programme))\b/i
const PROGRAM_URL_PATTERN = /(?:trainee|graduate[-_](?:scheme|program|programme|trainee)|(?:program|programme|scheme)[-_].*graduate)/i
const EXPIRED_PATTERN = /\b(?:this (?:job|vacancy) has expired|applications? (?:are )?closed|position (?:is )?closed|no longer accepting applications)\b/i

const monthNumbers = new Map([
  ["january", 1], ["jan", 1], ["januari", 1],
  ["february", 2], ["feb", 2], ["februari", 2],
  ["march", 3], ["mar", 3], ["mars", 3],
  ["april", 4], ["apr", 4],
  ["may", 5], ["maj", 5],
  ["june", 6], ["jun", 6], ["juni", 6],
  ["july", 7], ["jul", 7], ["juli", 7],
  ["august", 8], ["aug", 8],
  ["september", 9], ["sep", 9], ["sept", 9],
  ["october", 10], ["oct", 10], ["oktober", 10], ["okt", 10],
  ["november", 11], ["nov", 11],
  ["december", 12], ["dec", 12],
])

function normalizeWhitespace(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()
}

function normalizedDateText(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

function validIsoDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return date.toISOString().slice(0, 10)
}

export function parseTraineeDeadline(value: string | null | undefined, referenceYear = new Date().getUTCFullYear()) {
  if (!value || /\b(?:ongoing|rolling|open-ended|not specified|tbd)\b/i.test(value)) return null
  const normalized = normalizedDateText(value)

  const iso = normalized.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/)
  if (iso) return validIsoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]))

  const numeric = normalized.match(/\b(\d{1,2})[/.](\d{1,2})[/.](20\d{2})\b/)
  if (numeric) return validIsoDate(Number(numeric[3]), Number(numeric[2]), Number(numeric[1]))

  const dayMonth = normalized.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|jan|januari|february|feb|februari|march|mar|mars|april|apr|may|maj|june|jun|juni|july|jul|juli|august|aug|september|sept|sep|october|oct|oktober|okt|november|nov|december|dec)(?:\s+(20\d{2}))?\b/)
  if (dayMonth) {
    return validIsoDate(Number(dayMonth[3] || referenceYear), monthNumbers.get(dayMonth[2]) || 0, Number(dayMonth[1]))
  }

  const monthDay = normalized.match(/\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(20\d{2}))?\b/)
  if (monthDay) {
    return validIsoDate(Number(monthDay[3] || referenceYear), monthNumbers.get(monthDay[1]) || 0, Number(monthDay[2]))
  }

  const relative = normalized.match(/\b(\d{1,3})\s+days?\s+to\s+apply\b/)
  if (relative) {
    const date = new Date()
    date.setUTCHours(0, 0, 0, 0)
    date.setUTCDate(date.getUTCDate() + Number(relative[1]))
    return date.toISOString().slice(0, 10)
  }

  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : null
}

function extractDeadline(value: string, referenceYear?: number) {
  const searchable = normalizedDateText(value)
  const labelled = searchable.match(/(?:application deadline|closing date|apply by|apply before|applications? close|deadline|sista ansokningsdag|ansok senast)\s*:?\s*(.{0,100})/i)?.[1]
  if (labelled) return parseTraineeDeadline(labelled, referenceYear)
  const relative = searchable.match(/\b\d{1,3}\s+days?\s+to\s+apply\b/i)?.[0]
  return parseTraineeDeadline(relative, referenceYear)
}

function isExpired(deadline: string) {
  const today = new Date().toISOString().slice(0, 10)
  return deadline < today
}

function htmlToText(value: string) {
  return normalizeWhitespace(load(`<body>${value}</body>`)("body").text())
}

function stringValue(value: unknown) {
  return typeof value === "string" ? normalizeWhitespace(value) : ""
}

function findJobPosting(value: unknown): JsonLdJobPosting | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findJobPosting(item)
      if (match) return match
    }
    return null
  }
  if (!value || typeof value !== "object") return null

  const record = value as Record<string, unknown>
  const types = Array.isArray(record["@type"]) ? record["@type"] : [record["@type"]]
  if (types.some((type) => String(type).toLowerCase() === "jobposting")) return record as JsonLdJobPosting
  if (record["@graph"]) return findJobPosting(record["@graph"])
  return null
}

function parseJobPosting($: CheerioAPI): JsonLdJobPosting | null {
  let posting: JsonLdJobPosting | null = null
  $("script[type='application/ld+json']").each((_, element) => {
    if (posting) return
    try {
      posting = findJobPosting(JSON.parse($(element).text()))
    } catch {
      // Malformed third-party structured data is ignored.
    }
  })
  return posting as JsonLdJobPosting | null
}

function salaryText(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value)
  if (!value || typeof value !== "object") return ""
  const record = value as Record<string, unknown>
  const nested = record.value && typeof record.value === "object" ? record.value as Record<string, unknown> : record
  const min = stringValue(nested.minValue)
  const max = stringValue(nested.maxValue)
  const unit = stringValue(nested.unitText)
  const currency = stringValue(record.currency)
  return normalizeWhitespace([currency, min && max ? `${min}-${max}` : min || max, unit].filter(Boolean).join(" "))
}

function locationText(jobLocation: JsonLdJobPosting["jobLocation"], fallback: string) {
  const locations = Array.isArray(jobLocation) ? jobLocation : jobLocation ? [jobLocation] : []
  const names = locations.map((location) => {
    const address = location.address && typeof location.address === "object"
      ? location.address as Record<string, unknown>
      : {}
    const countryValue = address.addressCountry
    const country = typeof countryValue === "object" && countryValue
      ? stringValue((countryValue as Record<string, unknown>).name)
      : stringValue(countryValue)
    const locality = stringValue(address.addressLocality)
    const region = stringValue(address.addressRegion)
    const parts = [locality]
    if (region && !locality.toLowerCase().includes(region.toLowerCase())) parts.push(region)
    parts.push(country === "GB" ? "United Kingdom" : country)
    return [...new Set(parts.filter(Boolean))].join(", ")
  }).filter(Boolean)
  return names.length ? [...new Set(names)].join("; ") : fallback
}

function inferCompany(title: string, bodyText: string, fallback: string) {
  const patterns = [
    /\b(?:about|om)\s+([a-z0-9&.' -]{2,70}?)(?=\s+(?:is|are|offers|provides|invests|develops|works|ar|erbjuder|utvecklar)\b)/gi,
    /\b(?:this is|det har ar)\s+([a-z0-9&.' -]{2,70}?)(?=\s+(?:is|are|a |an |the |som )\b)/gi,
  ]
  const matches: string[] = []
  for (const pattern of patterns) {
    for (const match of bodyText.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").matchAll(pattern)) {
      if (match[1]) matches.push(normalizeWhitespace(match[1]))
    }
  }
  if (matches.length) return matches.at(-1) || fallback

  const prefix = title
    .replace(/\b(?:20\d{2})\b/g, "")
    .replace(/\b(?:technical|global|commercial|engineering|management)?\s*(?:graduate|trainee)(?:ship)?\s*(?:scheme|program|programme)?\b.*$/i, "")
    .replace(/[\s:;,-]+$/, "")
    .trim()
  const possessiveBrand = prefix.match(/^(.{2,50}?)s\s+outperformer$/i)?.[1]
  const cleanedPrefix = possessiveBrand || prefix
  return cleanedPrefix.length >= 2 && cleanedPrefix.length <= 70 ? cleanedPrefix : fallback
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function buildDescription(candidate: {
  title: string
  company: string
  location: string
  fields: string[]
  duration: string
  deadline: string
  salary: string
  sourceName: string
}) {
  const salary = candidate.salary ? `<li><strong>Compensation:</strong> ${escapeHtml(candidate.salary)}</li>` : ""
  return [
    `<p><strong>${escapeHtml(candidate.title)}</strong> is a structured graduate or trainee opportunity from ${escapeHtml(candidate.company)}.</p>`,
    "<ul>",
    `<li><strong>Location:</strong> ${escapeHtml(candidate.location)}</li>`,
    `<li><strong>Fields:</strong> ${escapeHtml(candidate.fields.join(", "))}</li>`,
    `<li><strong>Program duration:</strong> ${escapeHtml(candidate.duration)}</li>`,
    `<li><strong>Application deadline:</strong> ${escapeHtml(candidate.deadline)}</li>`,
    salary,
    "</ul>",
    `<p>This factual summary was prepared from structured listing data supplied by ${escapeHtml(candidate.sourceName)}. Review eligibility, responsibilities, benefits, and application instructions on the official listing before applying.</p>`,
  ].join("")
}

function buildCandidate(
  source: TraineeImportSourceDefinition,
  discovered: DiscoveredProgram,
  values: {
    title: string
    company: string
    location: string
    bodyText: string
    deadline: string
    publishedAt: string | null
    salary: string
  }
): TraineeImportCandidate {
  const fields = inferTraineeFields(values.title, values.bodyText)
  const duration = inferDuration(values.bodyText)
  const externalId = discovered.externalId
    || extractTraineeOpportunityId(discovered.url)
    || createHash("sha256").update(discovered.url).digest("hex").slice(0, 24)

  return {
    externalId,
    title: values.title,
    company: values.company,
    location: values.location,
    field: fields.join(", "),
    description: buildDescription({
      title: values.title,
      company: values.company,
      location: values.location,
      fields,
      duration,
      deadline: values.deadline,
      salary: values.salary,
      sourceName: source.name,
    }),
    duration,
    compensation: inferCompensation(`${values.salary} ${values.bodyText.slice(0, 1_500)}`),
    deadline: values.deadline,
    publishedAt: values.publishedAt,
    externalUrl: discovered.url,
    sourceId: source.id,
    sourceName: source.name,
    sourceMetadata: {
      ...(discovered.metadata || {}),
      salary: values.salary || null,
      source_description_policy: "factual-summary-with-canonical-link",
    },
  }
}

function absoluteUrl(value: string, base: string) {
  try {
    return new URL(value, base).toString()
  } catch {
    return ""
  }
}

function isProgramDiscovery(discovered: DiscoveredProgram) {
  return PROGRAM_TITLE_PATTERN.test(discovered.title || "") || PROGRAM_URL_PATTERN.test(discovered.url)
}

function extractGenericDeadline(bodyText: string, discovered: DiscoveredProgram, referenceYear?: number) {
  return parseTraineeDeadline(discovered.deadline, referenceYear) || extractDeadline(bodyText, referenceYear)
}

async function parseProgramDetail(source: TraineeImportSourceDefinition, discovered: DiscoveredProgram) {
  const response = await fetchApprovedTraineeSourceText(source, discovered.url, {
    maxBytes: 4 * 1024 * 1024,
    timeoutMs: source.adapter === "milkround-html" ? 60_000 : 25_000,
  })
  const $ = load(response.text)
  const posting = parseJobPosting($)
  const postingDescription = stringValue(posting?.description)
  const bodyText = normalizeWhitespace(`${discovered.bodyText || ""} ${htmlToText(postingDescription)} ${$("body").text()}`)
  const title = stringValue(posting?.title)
    || normalizeWhitespace($("h1").first().text())
    || discovered.title
    || "Graduate trainee program"

  if (!isProgramDiscovery({ ...discovered, title }) && source.adapter !== "higherin-state") return null

  const publishedAt = parseTraineeDeadline(stringValue(posting?.datePosted)) || discovered.publishedAt || null
  const referenceYear = publishedAt ? Number(publishedAt.slice(0, 4)) : undefined
  const deadline = parseTraineeDeadline(stringValue(posting?.validThrough), referenceYear)
    || extractGenericDeadline(bodyText, discovered, referenceYear)
  if (!deadline || isExpired(deadline)) return null
  if (EXPIRED_PATTERN.test(bodyText) && !stringValue(posting?.validThrough)) return null

  const hiringOrganization = posting?.hiringOrganization
  const company = stringValue(hiringOrganization?.name)
    || discovered.company
    || inferCompany(title, bodyText, source.organization)
  const location = locationText(posting?.jobLocation, discovered.location || source.defaultLocation)
  const salary = salaryText(posting?.baseSalary) || discovered.salary || ""

  return buildCandidate(source, discovered, {
    title,
    company,
    location,
    bodyText,
    deadline,
    publishedAt,
    salary,
  })
}

function parseTraineeGuiden(source: TraineeImportSourceDefinition, value: string) {
  const posts = JSON.parse(value) as Array<Record<string, unknown>>
  const candidates: TraineeImportCandidate[] = []

  for (const post of posts.slice(0, source.maxJobs || 100)) {
    const title = stringValue((post.title as Record<string, unknown> | undefined)?.rendered)
    const content = stringValue((post.content as Record<string, unknown> | undefined)?.rendered)
    const url = stringValue(post.link)
    const publishedAt = parseTraineeDeadline(stringValue(post.date))
    const referenceYear = publishedAt ? Number(publishedAt.slice(0, 4)) : undefined
    const bodyText = htmlToText(content)
    const deadline = extractDeadline(bodyText, referenceYear)
    if (!title || !url || !deadline || isExpired(deadline)) continue

    const company = inferCompany(title, bodyText, source.organization)
    candidates.push(buildCandidate(source, {
      url,
      externalId: String(post.id || ""),
      title,
      publishedAt,
      metadata: { wordpress_id: post.id || null, modified_at: post.modified || null },
    }, {
      title,
      company,
      location: source.defaultLocation,
      bodyText,
      deadline,
      publishedAt,
      salary: "",
    }))
  }
  return candidates
}

async function discoverGraduateships(source: TraineeImportSourceDefinition) {
  const landing = await fetchApprovedTraineeSourceText(source, source.sourceUrl, { maxBytes: source.maxListingBytes })
  const nonce = landing.text.match(/var ajaxfilter\s*=\s*\{[^}]*"nonce":"([^"]+)"/)?.[1]
  if (!nonce) throw new Error("Graduateships filter token was not found")

  const form = new URLSearchParams()
  form.set("action", "ajax_sort_jobs_filter")
  form.set("nonce", nonce)
  form.set("filter_args[job_type][]", "57")
  form.set("filter_args[btn_action]", "find")
  const response = await fetchApprovedTraineeSourceText(
    source,
    "https://graduateships.com/wp-admin/admin-ajax.php",
    {
      method: "POST",
      body: form.toString(),
      maxBytes: source.maxListingBytes,
      headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
    }
  )

  const $ = load(response.text)
  const programs: DiscoveredProgram[] = []
  $(".gs_job_item").each((_, element) => {
    const card = $(element)
    const titleLink = card.find(".gs_job_company_title a").first()
    const title = normalizeWhitespace(titleLink.text())
    const url = absoluteUrl(titleLink.attr("href") || "", source.sourceUrl)
    if (!url || !PROGRAM_TITLE_PATTERN.test(title)) return
    programs.push({
      url,
      title,
      company: normalizeWhitespace(card.find(".gs_job_item_title a").first().text()),
      location: normalizeWhitespace(card.find(".gs_job_item_location_marker").first().text()) || source.defaultLocation,
    })
  })
  return programs.slice(0, source.maxJobs || 60)
}

function discoverTargetJobs(source: TraineeImportSourceDefinition, html: string) {
  const $ = load(html)
  const programs = new Map<string, DiscoveredProgram>()
  $("a[href*='/jobs/']").each((_, element) => {
    const link = $(element)
    const url = absoluteUrl(link.attr("href") || "", source.sourceUrl)
    if (!url || programs.has(url)) return
    const card = link.closest("article").length ? link.closest("article") : link
    const cardText = normalizeWhitespace(card.text())
    if (/\bexpired\b/i.test(cardText)) return
    if (!PROGRAM_URL_PATTERN.test(url) && !PROGRAM_TITLE_PATTERN.test(cardText)) return
    programs.set(url, {
      url,
      title: normalizeWhitespace(card.find("h2, h3").last().text()) || undefined,
      deadline: cardText,
      bodyText: cardText,
    })
  })
  return [...programs.values()]
}

function extractHigherinState(value: string) {
  const match = value.match(/window\.__RMP_SEARCH_RESULTS_INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/)
  if (!match) throw new Error("Higherin listing state was not found")
  return JSON.parse(match[1]) as { data?: Array<Record<string, unknown>> }
}

function discoverHigherin(source: TraineeImportSourceDefinition, html: string) {
  const state = extractHigherinState(html)
  return (state.data || []).map((job): DiscoveredProgram => ({
    url: stringValue(job.url),
    externalId: String(job.jobId || job.id || ""),
    title: stringValue(job.jobTitle),
    company: stringValue(job.companyName),
    location: stringValue(job.jobLocationNamesTrimmed || job.jobLocationNames) || source.defaultLocation,
    deadline: stringValue(job.deadline),
    salary: stringValue(job.salary || job.salaryNotes),
    metadata: { job_type: job.jobTypeName || null, company_id: job.companyId || null },
  })).filter((job) => job.url && job.title && parseTraineeDeadline(job.deadline))
}

function discoverMilkround(source: TraineeImportSourceDefinition, html: string) {
  const $ = load(html)
  const programs: DiscoveredProgram[] = []
  $("article[data-at='job-item']").each((_, element) => {
    const card = $(element)
    const link = card.find("a[data-at='job-item-title']").first()
    const title = normalizeWhitespace(link.text())
    const url = absoluteUrl(link.attr("href") || "", source.sourceUrl)
    if (!url || !PROGRAM_TITLE_PATTERN.test(title)) return
    programs.push({
      url,
      externalId: card.attr("id")?.match(/(\d{5,})/)?.[1],
      title,
      company: normalizeWhitespace(card.find("[data-at='job-item-company-name']").first().text()),
      location: normalizeWhitespace(card.find("[data-at='job-item-location']").first().text()) || source.defaultLocation,
      salary: normalizeWhitespace(card.find("[data-at='job-item-salary-info']").first().text()),
      bodyText: normalizeWhitespace(card.text()),
    })
  })
  return programs.slice(0, source.maxJobs || 25)
}

function listingUrls(source: TraineeImportSourceDefinition) {
  const count = Math.max(1, source.listingPageCount || 1)
  return Array.from({ length: count }, (_, index) => {
    if (index === 0) return source.sourceUrl
    if (source.adapter === "higherin-state") {
      const url = new URL(source.sourceUrl)
      url.searchParams.set("page", String(index + 1))
      return url.toString()
    }
    if (source.adapter === "targetjobs-html") return `${source.sourceUrl}/${index + 1}`
    return source.sourceUrl
  })
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, callback: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length)
  let nextIndex = 0
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++
      results[index] = await callback(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
  return results
}

function dedupeDiscoveries(items: DiscoveredProgram[], maxJobs: number) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.url.toLowerCase().replace(/\/+$/, "")
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, maxJobs)
}

export async function scrapeTraineeProgramSource(source: TraineeImportSourceDefinition) {
  if (!source.scannable) throw new Error(source.accessNote || "This source is not approved for automated scanning")

  if (source.adapter === "traineeguiden-wordpress") {
    const response = await fetchApprovedTraineeSourceText(source, source.sourceUrl, { maxBytes: source.maxListingBytes })
    return { candidates: parseTraineeGuiden(source, response.text), errors: [] as string[] }
  }

  let discovered: DiscoveredProgram[] = []
  if (source.adapter === "graduateships-ajax") {
    discovered = await discoverGraduateships(source)
  } else {
    for (const url of listingUrls(source)) {
      const response = await fetchApprovedTraineeSourceText(source, url, {
        maxBytes: source.maxListingBytes,
        timeoutMs: source.adapter === "milkround-html" ? 60_000 : 25_000,
      })
      if (source.adapter === "higherin-state") discovered.push(...discoverHigherin(source, response.text))
      if (source.adapter === "targetjobs-html") discovered.push(...discoverTargetJobs(source, response.text))
      if (source.adapter === "milkround-html") discovered.push(...discoverMilkround(source, response.text))
    }
  }

  discovered = dedupeDiscoveries(discovered, source.maxJobs || 60)
  const errors: string[] = []
  const candidates = await mapWithConcurrency(
    discovered,
    source.crawlDelayMs ? 1 : DETAIL_CONCURRENCY,
    async (program) => {
      try {
        const candidate = await parseProgramDetail(source, program)
        if (source.crawlDelayMs) await new Promise((resolve) => setTimeout(resolve, source.crawlDelayMs))
        return candidate
      } catch (error) {
        errors.push(`${program.title || program.url}: ${error instanceof Error ? error.message : "detail request failed"}`)
        return null
      }
    }
  )

  return {
    candidates: candidates.filter((candidate): candidate is TraineeImportCandidate => Boolean(candidate)),
    errors,
  }
}
