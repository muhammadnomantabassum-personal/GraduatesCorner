import "server-only"

import { createHash } from "node:crypto"
import { load, type CheerioAPI } from "cheerio"
import { inferResearchFields, resolveCoveredOrganization } from "./classify"
import { extractOpportunityId, normalizeOpportunityUrl } from "./dedupe"
import { fetchApprovedSourceText } from "./fetch"
import type { PhdImportCandidate, PhdImportSourceDefinition } from "./types"

type DiscoveredJob = {
  title: string
  url: string
  deadline: string | null
  publishedAt?: string | null
  externalId?: string | null
  organization?: string | null
  location?: string | null
  descriptionHtml?: string | null
  bodyText?: string | null
  fieldHints?: string[]
}

const MAX_JOBS_PER_SOURCE = 60
const DETAIL_CONCURRENCY = 6
const LISTING_CONCURRENCY = 3
const PHD_TITLE_PATTERN = /\b(?:ph\.?\s*d|doctoral|doctorate|doktorand(?:er|plats|student)?|forskarstuderande|licentiate|stipendiat|promovendus|v\u00e4it\u00f6skirjatutkija|tohtorikoulutettava)\b/i
const POSTDOC_PATTERN = /\b(?:postdoc|post-doctor)\b/i
const EDUCATION_PAGE_PATTERN = /\b(?:doctoral studies|doctoral education|doctoral course|doctoral school|doctoral programme|doctoral program|doctoral degree|doctoral thesis|prospective phd|regulations?)\b/i
const PHD_ROLE_PATTERN = /\b(?:(?:ph\.?\s*d|doctoral|doctorate)\s+(?:student|students|candidate|position|researcher|studentship)|doktorand(?:er|plats|student)?|forskarstuderande|licentiate|stipendiat|promovendus|v\u00e4it\u00f6skirjatutkija|tohtorikoulutettava)\b/i
const STOP_CONTENT_PATTERN = /^(?:share links|cookies?|return to job vacancies|more vacancies|apply for position|login and apply)$/i

const monthNumbers: Record<string, string> = {
  jan: "01",
  january: "01",
  januar: "01",
  januari: "01",
  feb: "02",
  february: "02",
  februar: "02",
  februari: "02",
  mar: "03",
  march: "03",
  mars: "03",
  apr: "04",
  april: "04",
  may: "05",
  mai: "05",
  maj: "05",
  jun: "06",
  june: "06",
  juni: "06",
  jul: "07",
  july: "07",
  juli: "07",
  aug: "08",
  august: "08",
  augusti: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
  desember: "12",
}

const monthNamePattern = Object.keys(monthNumbers)
  .sort((a, b) => b.length - a.length)
  .join("|")

function normalizeWhitespace(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()
}

function normalizeTitle(value: string) {
  return normalizeWhitespace(value)
    .replace(/\s+(?:Last (?:day to apply|application date)|Application deadline|Published):.*$/i, "")
    .slice(0, 220)
}

function isPhdTitle(value: string) {
  const title = normalizeTitle(value)
  if (!PHD_TITLE_PATTERN.test(title)) return false
  if (POSTDOC_PATTERN.test(title) && !PHD_ROLE_PATTERN.test(title)) return false
  return !EDUCATION_PAGE_PATTERN.test(title) || PHD_ROLE_PATTERN.test(title)
}

function isApprovedJobUrl(source: PhdImportSourceDefinition, value: string) {
  try {
    const url = new URL(value, source.sourceUrl)
    const hostname = url.hostname.toLowerCase()
    const decodedPath = decodeURIComponent(url.pathname)

    if (hostname.endsWith("varbi.com")) {
      return decodedPath.includes("/what:job/jobID:")
    }

    if (hostname === "web103.reachmee.com") {
      return Boolean(url.searchParams.get("job_id") || url.searchParams.get("rmjob"))
    }

    if (source.id === "uppsala-university") {
      return decodedPath.includes("/job-details") && Boolean(url.searchParams.get("query"))
    }

    if (source.id === "orebro-university") {
      return decodedPath.includes("/available-positions/job/") && Boolean(url.searchParams.get("jid"))
    }

    if (source.id === "linkoping-university") {
      return /\/vacancies\/\d+\/?$/.test(decodedPath)
    }

    if (source.id === "slu" && source.detailUrlPrefix) {
      return url.href.startsWith(source.detailUrlPrefix) && url.href !== source.detailUrlPrefix
    }

    if (source.jobUrlPattern) {
      source.jobUrlPattern.lastIndex = 0
      return source.jobUrlPattern.test(`${decodedPath}${url.search}`)
    }

    return false
  } catch {
    return false
  }
}

function parseDateValue(value: string) {
  const normalized = normalizeWhitespace(value).replace(/(\d)(st|nd|rd|th)\b/gi, "$1")

  const iso = normalized.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])(?!\d)/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`

  const dayMonthYear = normalized.match(
    new RegExp(
      `\\b(0?[1-9]|[12]\\d|3[01])[\\s./-]+(${monthNamePattern})[\\s,./-]+(20\\d{2})(?!\\d)`,
      "i"
    )
  )
  if (dayMonthYear) {
    const month = monthNumbers[dayMonthYear[2].toLowerCase()]
    if (month) return `${dayMonthYear[3]}-${month}-${dayMonthYear[1].padStart(2, "0")}`
  }

  const monthDayYear = normalized.match(
    new RegExp(
      `\\b(${monthNamePattern})\\s+(0?[1-9]|[12]\\d|3[01]),?\\s+(20\\d{2})(?!\\d)`,
      "i"
    )
  )
  if (monthDayYear) {
    const month = monthNumbers[monthDayYear[1].toLowerCase()]
    if (month) return `${monthDayYear[3]}-${month}-${monthDayYear[2].padStart(2, "0")}`
  }

  const numeric = normalized.match(/\b(0?[1-9]|[12]\d|3[01])[/.](0?[1-9]|1[0-2])[/.](20\d{2})(?!\d)/)
  if (numeric) return `${numeric[3]}-${numeric[2].padStart(2, "0")}-${numeric[1].padStart(2, "0")}`

  return null
}

function extractDeadline(value: string) {
  const pattern =
    /(?:last application date|application deadline|application period ends|application closes on|applications? must be submitted by|last day to apply|closing date for application|closing date|apply by|deadline|due date|ends on|no later than|s\u00f8knadsfrist|soknadsfrist|ans\u00f6kningstiden slutar|ansokningstiden slutar|hakuaika p\u00e4\u00e4ttyy)\s*:?\s*([^|]{4,100})/gi

  for (const match of value.matchAll(pattern)) {
    const deadline = parseDateValue(match[1])
    if (deadline) return deadline
  }

  return null
}

function extractPublishedAt(value: string) {
  const labelled = value.match(/(?:publishing date|published|date published)\s*:?\s*([^|]{4,40})/i)
  return labelled ? parseDateValue(labelled[1]) : null
}

function discoverHtmlJobs(source: PhdImportSourceDefinition, html: string) {
  const $ = load(html)
  const jobs = new Map<string, DiscoveredJob>()

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href")
    if (!href) return

    const url = new URL(href, source.sourceUrl).toString()
    if (!isApprovedJobUrl(source, url)) return

    const container = $(element)
      .closest("li, article, tr, [class*='job'], [class*='vacan'], [class*='position']")
      .first()
    const rawTitle = normalizeWhitespace(
      $(element).text() ||
      container.find("h1, h2, h3, h4, [class*='title']").first().text()
    )
    if (!isPhdTitle(rawTitle)) return

    const context = normalizeWhitespace(container.text() || $(element).parent().text())

    jobs.set(url, {
      title: normalizeTitle(rawTitle),
      url,
      deadline: extractDeadline(context),
    })
  })

  return Array.from(jobs.values()).slice(0, source.maxJobs ?? MAX_JOBS_PER_SOURCE)
}

function discoverFeedJobs(source: PhdImportSourceDefinition, xml: string) {
  const $ = load(xml, { xmlMode: true })
  const jobs = new Map<string, DiscoveredJob>()

  $("item, entry").each((_, element) => {
    const item = $(element)
    const title = normalizeTitle(item.find("title").first().text())
    const link =
      item.find("link").first().attr("href") ||
      item.find("link").first().text() ||
      item.find("guid").first().text()
    const context = normalizeWhitespace(
      `${item.find("description").first().text()} ${item.find("summary").first().text()}`
    )

    if (!link || !isPhdTitle(title)) return
    const url = new URL(link, source.sourceUrl).toString()
    if (!isApprovedJobUrl(source, url)) return

    jobs.set(url, {
      title,
      url,
      deadline: extractDeadline(context),
    })
  })

  return Array.from(jobs.values()).slice(0, source.maxJobs ?? MAX_JOBS_PER_SOURCE)
}

function discoverSitemapJobs(source: PhdImportSourceDefinition, xml: string) {
  const $ = load(xml, { xmlMode: true })
  const recentCutoff = new Date()
  recentCutoff.setUTCDate(recentCutoff.getUTCDate() - 180)
  const jobs: DiscoveredJob[] = []

  $("url").each((_, element) => {
    const item = $(element)
    const url = normalizeWhitespace(item.find("loc").first().text())
    const lastModified = normalizeWhitespace(item.find("lastmod").first().text())
    if (!url || !isApprovedJobUrl(source, url)) return

    const modifiedDate = lastModified ? new Date(lastModified) : null
    if (modifiedDate && !Number.isNaN(modifiedDate.valueOf()) && modifiedDate < recentCutoff) return

    jobs.push({ title: "", url, deadline: null })
  })

  return jobs.slice(0, source.maxJobs ?? MAX_JOBS_PER_SOURCE)
}

function htmlToText(value: string) {
  return normalizeWhitespace(load(`<main>${value}</main>`)("main").text())
}

function discoverJobbnorgeJobs(source: PhdImportSourceDefinition, value: string) {
  const payload = JSON.parse(value) as {
    jobs?: Array<{
      id?: number | string
      title?: string
      summary?: string
      employer?: string
      link?: string
      deadline?: string
      publicationDate?: string
      locations?: Array<{ area?: string; municipality?: string; isPrimary?: boolean }>
    }>
  }

  const jobs = new Map<string, DiscoveredJob>()
  for (const item of payload.jobs || []) {
    const title = normalizeTitle(item.title || "")
    const url = item.link ? new URL(item.link, source.sourceUrl).toString() : ""
    const organization = resolveCoveredOrganization(source, [item.employer])
    if (!url || !organization || !isPhdTitle(title) || !isApprovedJobUrl(source, url)) continue

    const primaryLocation =
      item.locations?.find((location) => location.isPrimary) || item.locations?.[0]
    const location = primaryLocation?.area || primaryLocation?.municipality || null

    jobs.set(url, {
      title,
      url,
      deadline: item.deadline ? parseDateValue(item.deadline) : null,
      publishedAt: item.publicationDate ? parseDateValue(item.publicationDate) : null,
      externalId: item.id ? String(item.id) : null,
      organization: item.employer || organization.name,
      location,
      bodyText: normalizeWhitespace(item.summary || ""),
    })
  }

  return Array.from(jobs.values()).slice(0, source.maxJobs ?? MAX_JOBS_PER_SOURCE)
}

function discoverTalentAdoreJobs(source: PhdImportSourceDefinition, value: string) {
  const payload = JSON.parse(value) as {
    jobs?: Array<{
      id?: string
      job_token?: string
      name?: string
      link?: string
      description_html?: string
      description_text?: string
      start_date?: string
      due_date?: string
      city?: string
      country?: string
    }>
  }

  const jobs = new Map<string, DiscoveredJob>()
  for (const item of payload.jobs || []) {
    const title = normalizeTitle(item.name || "")
    const url = item.link ? new URL(item.link, source.sourceUrl).toString() : ""
    if (!url || !isPhdTitle(title) || !isApprovedJobUrl(source, url)) continue

    jobs.set(url, {
      title,
      url,
      deadline: item.due_date ? parseDateValue(item.due_date) : null,
      publishedAt: item.start_date ? parseDateValue(item.start_date) : null,
      externalId: item.job_token || item.id || null,
      location: [item.city, item.country].filter(Boolean).join(", ") || null,
      descriptionHtml: item.description_html || null,
      bodyText: normalizeWhitespace(
        item.description_text || htmlToText(item.description_html || "")
      ),
    })
  }

  return Array.from(jobs.values()).slice(0, source.maxJobs ?? MAX_JOBS_PER_SOURCE)
}

function extractAcademicTransferToken(html: string) {
  const payloadMatch = html.match(
    /<script type="application\/json" data-nuxt-data="nuxt-app"[^>]*>([\s\S]*?)<\/script>/i
  )
  if (!payloadMatch) throw new Error("AcademicTransfer public data token payload was not found")

  const tokenIndexMatch = payloadMatch[1].match(
    /\$satDataApiPublicAccessToken"\s*:\s*(\d+)/
  )
  if (!tokenIndexMatch) throw new Error("AcademicTransfer public data token index was not found")

  const payload = JSON.parse(payloadMatch[1]) as unknown[]
  const token = payload[Number(tokenIndexMatch[1])]
  if (typeof token !== "string" || token.length < 20) {
    throw new Error("AcademicTransfer public data token was invalid")
  }
  return token
}

type AcademicTransferVacancy = {
  external_id?: number | string
  absolute_url?: string
  title?: string
  description?: string
  excerpt?: string
  start_date?: string
  end_date?: string
  city?: string
  country_code?: string
  organisation_name?: string
  keywords?: string[]
}

function discoverAcademicTransferJobs(
  source: PhdImportSourceDefinition,
  records: AcademicTransferVacancy[]
) {
  const jobs = new Map<string, DiscoveredJob>()
  for (const item of records) {
    const title = normalizeTitle(item.title || "")
    const url = item.absolute_url ? new URL(item.absolute_url, source.sourceUrl).toString() : ""
    const organization = resolveCoveredOrganization(source, [item.organisation_name])
    if (!url || !organization || !isPhdTitle(title) || !isApprovedJobUrl(source, url)) continue

    const descriptionHtml = item.description || ""
    jobs.set(url, {
      title,
      url,
      deadline: item.end_date ? parseDateValue(item.end_date) : null,
      publishedAt: item.start_date ? parseDateValue(item.start_date) : null,
      externalId: item.external_id ? String(item.external_id) : null,
      organization: item.organisation_name || organization.name,
      location: [item.city, "Netherlands"].filter(Boolean).join(", "),
      descriptionHtml,
      bodyText: normalizeWhitespace(
        `${item.excerpt || ""} ${htmlToText(descriptionHtml)}`
      ),
    })
  }

  return Array.from(jobs.values()).slice(0, source.maxJobs ?? MAX_JOBS_PER_SOURCE)
}

async function fetchAcademicTransferJobs(
  source: PhdImportSourceDefinition,
  listingHtml: string
) {
  const token = extractAcademicTransferToken(listingHtml)
  const apiHeaders = {
    accept: "application/json; version=2",
    "accept-language": "en",
    authorization: `Bearer ${token}`,
  }
  const pageSize = 50
  const firstUrl =
    `https://api.academictransfer.com/vacancies/?function_types=9&limit=${pageSize}&offset=0`
  const firstResponse = await fetchApprovedSourceText(source, firstUrl, {
    headers: apiHeaders,
    maxBytes: source.maxListingBytes,
  })
  const firstPage = JSON.parse(firstResponse.text) as {
    count?: number
    results?: AcademicTransferVacancy[]
  }
  const total = Math.min(
    Number(firstPage.count) || firstPage.results?.length || 0,
    source.maxJobs ?? 300
  )
  const offsets = Array.from(
    { length: Math.max(0, Math.ceil(total / pageSize) - 1) },
    (_, index) => (index + 1) * pageSize
  )
  const pageResults = await mapWithConcurrency(offsets, LISTING_CONCURRENCY, async (offset) => {
    const response = await fetchApprovedSourceText(
      source,
      `https://api.academictransfer.com/vacancies/?function_types=9&limit=${pageSize}&offset=${offset}`,
      {
        headers: apiHeaders,
        maxBytes: source.maxListingBytes,
      }
    )
    return (JSON.parse(response.text) as { results?: AcademicTransferVacancy[] }).results || []
  })

  const additionalRecords = pageResults.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  )
  const errors = pageResults.flatMap((result) =>
    result.status === "rejected"
      ? [result.reason instanceof Error ? result.reason.message : "Unable to fetch AcademicTransfer page"]
      : []
  )

  return {
    discovered: discoverAcademicTransferJobs(source, [
      ...(firstPage.results || []),
      ...additionalRecords,
    ]),
    errors,
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildDescription(
  $: CheerioAPI,
  source: PhdImportSourceDefinition,
  organization: string,
  externalUrl: string
) {
  const root = $("main").first().length
    ? $("main").first().clone()
    : $("#main-content").first().length
      ? $("#main-content").first().clone()
      : $("body").first().clone()

  root.find("script, style, nav, header, footer, form, button, noscript, iframe, svg").remove()

  const parts: string[] = []
  const seen = new Set<string>()
  let foundTitle = false
  let listOpen = false
  let totalLength = 0

  const closeList = () => {
    if (listOpen) parts.push("</ul>")
    listOpen = false
  }

  root.find("h1, h2, h3, p, li").each((_, element) => {
    if (totalLength >= 18_000) return
    const tag = element.tagName.toLowerCase()
    const value = normalizeWhitespace($(element).text())

    if (tag === "h1") {
      foundTitle = true
      return
    }
    if (!foundTitle || !value || seen.has(value) || STOP_CONTENT_PATTERN.test(value)) return
    if (/^(?:apply|subscribe|sign in|show more|contact)$/i.test(value)) return
    seen.add(value)

    if (tag === "h2" || tag === "h3") {
      closeList()
      if (value.length >= 3 && value.length <= 160) {
        parts.push(`<h3>${escapeHtml(value)}</h3>`)
        totalLength += value.length
      }
      return
    }

    if (tag === "li") {
      if (value.length < 8 || value.length > 700) return
      if (!listOpen) {
        parts.push("<ul>")
        listOpen = true
      }
      parts.push(`<li>${escapeHtml(value)}</li>`)
      totalLength += value.length
      return
    }

    closeList()
    if (value.length >= 25 && value.length <= 2_000) {
      parts.push(`<p>${escapeHtml(value)}</p>`)
      totalLength += value.length
    }
  })
  closeList()

  const sourceNote = [
    "<p>",
    `<strong>Official university vacancy imported from ${escapeHtml(organization)}.</strong> `,
    "Details are presented for discovery and may change. ",
    `<a href="${escapeHtml(externalUrl)}" target="_blank" rel="noopener noreferrer">Confirm the latest requirements and apply on the official source.</a>`,
    "</p>",
  ].join("")

  return [sourceNote, ...parts].join("")
}

function extractLabelledValue(text: string, labels: string[], stopLabels: string[]) {
  const labelPattern = labels.map((label) => label.replace(/\s+/g, "\\s+")).join("|")
  const stopPattern = stopLabels.map((label) => label.replace(/\s+/g, "\\s+")).join("|")
  const match = text.match(new RegExp(`(?:${labelPattern})\\s*:?\\s*(.{2,100}?)(?=\\s*(?:${stopPattern})\\s*:?|$)`, "i"))
  return normalizeWhitespace(match?.[1] || "")
}

function inferLocation(
  source: PhdImportSourceDefinition,
  bodyText: string,
  defaultLocation: string,
  discoveredLocation?: string | null
) {
  if (discoveredLocation) {
    const normalized = normalizeWhitespace(discoveredLocation)
    if (normalized && normalized.length <= 100) {
      return new RegExp(`\\b${source.country}\\b`, "i").test(normalized)
        ? normalized
        : `${normalized}, ${source.country}`
    }
  }

  const labelled = extractLabelledValue(
    bodyText,
    ["study location", "campus location", "place of work", "placement", "location", "city", "town"],
    ["school", "third-cycle subject", "county", "country", "reference number", "scope", "contract type", "salary", "published", "last application date"]
  )
  const looksLikeProse =
    /^(?:and|or|the|a|an|we|you|this|that|our)\b/i.test(labelled) ||
    /\b(?:integration|competitive|employment|applicant|position|responsibilities|university)\b/i.test(labelled)
  if (
    !labelled ||
    labelled.length > 60 ||
    labelled.split(/\s+/).length > 8 ||
    looksLikeProse
  ) {
    return defaultLocation
  }
  return new RegExp(`\\b${source.country}\\b`, "i").test(labelled)
    ? labelled
    : `${labelled}, ${source.country}`
}

function isExpired(deadline: string) {
  const endOfDeadline = new Date(`${deadline}T23:59:59Z`)
  return endOfDeadline.valueOf() < Date.now()
}

async function parseJobDetail(
  source: PhdImportSourceDefinition,
  discovered: DiscoveredJob
): Promise<PhdImportCandidate | null> {
  const response = discovered.descriptionHtml
    ? {
        text: `<main><h1>${escapeHtml(discovered.title)}</h1>${discovered.descriptionHtml}</main>`,
        finalUrl: discovered.url,
      }
    : await fetchApprovedSourceText(source, discovered.url)
  const $ = load(response.text)
  const title = normalizeTitle($("h1").first().text() || discovered.title)
  if (!isPhdTitle(title)) return null

  $("script, style, noscript, iframe, svg").remove()
  const bodyText = normalizeWhitespace(
    `${discovered.bodyText || ""} ${$("body").text()}`
  )
  const deadline = extractDeadline(bodyText) || discovered.deadline
  if (!deadline || isExpired(deadline)) return null

  const organization = resolveCoveredOrganization(source, [
    discovered.organization,
    $("title").first().text(),
    bodyText,
  ])
  if (!organization) return null

  const publishedAt = discovered.publishedAt || extractPublishedAt(bodyText)
  const canonicalUrl = normalizeOpportunityUrl(discovered.url)
  if (!canonicalUrl) throw new Error(`Could not normalize vacancy URL ${discovered.url}`)
  const externalId =
    discovered.externalId ||
    extractOpportunityId(canonicalUrl) ||
    createHash("sha256").update(canonicalUrl).digest("hex").slice(0, 24)
  const fields = inferResearchFields(title, bodyText, discovered.fieldHints)

  return {
    externalId,
    title,
    organization: organization.name,
    location: inferLocation(
      source,
      bodyText,
      organization.defaultLocation,
      discovered.location
    ),
    subject: fields.join(", "),
    description: buildDescription($, source, organization.name, canonicalUrl),
    deadline,
    publishedAt,
    compensation: "paid",
    externalUrl: canonicalUrl,
    sourceId: source.id,
    sourceName: source.name,
    sourceMetadata: {
      country: source.country,
      organization: organization.name,
      fields,
      platform: source.platform,
      sourcePage: source.publicUrl,
      detailUrl: response.finalUrl,
      capturedAt: new Date().toISOString(),
    },
  }
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>
) {
  const results: PromiseSettledResult<R>[] = new Array(values.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < values.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      try {
        results[currentIndex] = { status: "fulfilled", value: await mapper(values[currentIndex]) }
      } catch (reason) {
        results[currentIndex] = { status: "rejected", reason }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()))
  return results
}

function getListingUrls(source: PhdImportSourceDefinition) {
  const pageCount = Math.max(1, source.listingPageCount || 1)
  const urls = [source.sourceUrl]
  if (pageCount === 1) return urls

  const parameter = source.listingPageParameter || "page"
  const start = source.listingPageStart ?? 2
  for (let index = 0; index < pageCount - 1; index += 1) {
    const url = new URL(source.sourceUrl)
    url.searchParams.set(parameter, String(start + index))
    urls.push(url.toString())
  }
  return urls
}

export async function scrapeUniversityPhdSource(source: PhdImportSourceDefinition) {
  const listingResults = await mapWithConcurrency(
    getListingUrls(source),
    LISTING_CONCURRENCY,
    (url) =>
      fetchApprovedSourceText(source, url, {
        maxBytes:
          source.maxListingBytes ||
          (source.platform === "sitemap" ? 8 * 1024 * 1024 : undefined),
        timeoutMs: source.platform === "sitemap" ? 25_000 : undefined,
      })
  )
  const listings = listingResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : []
  )
  const listingErrors = listingResults.flatMap((result) =>
    result.status === "rejected"
      ? [result.reason instanceof Error ? result.reason.message : "Unable to fetch source listing"]
      : []
  )
  if (listings.length === 0) {
    throw new Error(listingErrors[0] || "Unable to fetch source listing")
  }

  let discoveryErrors = listingErrors
  let discovered: DiscoveredJob[]
  if (source.adapter === "academictransfer-api") {
    const academicTransfer = await fetchAcademicTransferJobs(source, listings[0].text)
    discovered = academicTransfer.discovered
    discoveryErrors = [...discoveryErrors, ...academicTransfer.errors]
  } else {
    const discoveredByUrl = new Map<string, DiscoveredJob>()
    for (const listing of listings) {
      const jobs =
        source.adapter === "jobbnorge-api"
          ? discoverJobbnorgeJobs(source, listing.text)
          : source.adapter === "talentadore-json"
            ? discoverTalentAdoreJobs(source, listing.text)
            : source.platform === "feed"
              ? discoverFeedJobs(source, listing.text)
              : source.platform === "sitemap"
                ? discoverSitemapJobs(source, listing.text)
                : discoverHtmlJobs(source, listing.text)
      for (const job of jobs) {
        discoveredByUrl.set(normalizeOpportunityUrl(job.url), job)
      }
    }
    discovered = Array.from(discoveredByUrl.values()).slice(
      0,
      source.maxJobs ?? MAX_JOBS_PER_SOURCE
    )
  }

  const detailResults = await mapWithConcurrency(discovered, DETAIL_CONCURRENCY, (job) =>
    parseJobDetail(source, job)
  )
  const candidates = detailResults.flatMap((result) =>
    result.status === "fulfilled" && result.value ? [result.value] : []
  )
  const errors = [
    ...discoveryErrors,
    ...detailResults.flatMap((result) =>
      result.status === "rejected"
        ? [result.reason instanceof Error ? result.reason.message : "Unable to parse a vacancy"]
        : []
    ),
  ]

  return {
    candidates,
    discovered: discovered.length,
    errors,
  }
}
