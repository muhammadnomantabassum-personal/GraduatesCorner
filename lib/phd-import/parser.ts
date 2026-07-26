import "server-only"

import { createHash } from "node:crypto"
import { load, type CheerioAPI } from "cheerio"
import { fetchApprovedSourceText } from "./fetch"
import type { PhdImportCandidate, PhdImportSourceDefinition } from "./types"

type DiscoveredJob = {
  title: string
  url: string
  deadline: string | null
}

const MAX_JOBS_PER_SOURCE = 60
const DETAIL_CONCURRENCY = 6
const PHD_TITLE_PATTERN = /\b(?:ph\.?\s*d|doctoral|doctorate|doktorand(?:er|plats|student)?|forskarstuderande|licentiate)\b/i
const POSTDOC_PATTERN = /\b(?:postdoc|post-doctor)\b/i
const EDUCATION_PAGE_PATTERN = /\b(?:doctoral studies|doctoral education|doctoral course|doctoral school|doctoral programme|doctoral program|doctoral degree|doctoral thesis|prospective phd|regulations?)\b/i
const PHD_ROLE_PATTERN = /\b(?:(?:ph\.?\s*d|doctoral|doctorate)\s+(?:student|students|candidate|position|researcher|studentship)|doktorand(?:er|plats|student)?|forskarstuderande|licentiate)\b/i
const STOP_CONTENT_PATTERN = /^(?:share links|cookies?|return to job vacancies|more vacancies|apply for position|login and apply)$/i

const subjectRules: Array<[RegExp, string]> = [
  [/\b(?:artificial intelligence|machine learning|deep learning|computer science|software|cybersecurity|data science)\b/i, "Computer Science"],
  [/\b(?:electrical engineering|electronics|wireless|robotics|automation|control systems)\b/i, "Electrical Engineering"],
  [/\b(?:mechanical engineering|manufacturing|materials science|energy technology)\b/i, "Engineering"],
  [/\b(?:medicine|medical|biomed|health|clinical|neuroscience|cancer)\b/i, "Medical Sciences"],
  [/\b(?:biology|ecology|microbiology|genomics|proteomics|biochemistry)\b/i, "Life Sciences"],
  [/\b(?:chemistry|chemical)\b/i, "Chemistry"],
  [/\b(?:physics|astronomy|optics|quantum)\b/i, "Physics"],
  [/\b(?:mathematics|statistics)\b/i, "Mathematics"],
  [/\b(?:economics|business|management|finance)\b/i, "Economics and Management"],
  [/\b(?:social science|sociology|political science|peace and development|education|media|communication)\b/i, "Social Sciences"],
  [/\b(?:environment|sustainability|climate|agriculture|forestry)\b/i, "Environmental Sciences"],
  [/\b(?:humanities|history|philosophy|language|literature|religious studies)\b/i, "Humanities"],
]

const monthNumbers: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
}

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
  if (!PHD_TITLE_PATTERN.test(title) || POSTDOC_PATTERN.test(title)) return false
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
    /\b(0?[1-9]|[12]\d|3[01])[\s./-]+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s,./-]+(20\d{2})(?!\d)/i
  )
  if (dayMonthYear) {
    const month = monthNumbers[dayMonthYear[2].toLowerCase()]
    if (month) return `${dayMonthYear[3]}-${month}-${dayMonthYear[1].padStart(2, "0")}`
  }

  const monthDayYear = normalized.match(
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(0?[1-9]|[12]\d|3[01]),?\s+(20\d{2})(?!\d)/i
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
    /(?:last application date|application deadline|last day to apply|closing date for application|closing date|apply by|deadline|no later than)\s*:?\s*([^|]{4,80})/gi

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

function extractExternalId(value: string) {
  const url = new URL(value)
  const queryId =
    url.searchParams.get("job_id") ||
    url.searchParams.get("rmjob") ||
    url.searchParams.get("query") ||
    url.searchParams.get("jid")
  if (queryId) return queryId

  const decoded = decodeURIComponent(url.pathname)
  const varbiId = decoded.match(/jobID:(\d+)/i)?.[1]
  if (varbiId) return varbiId

  const pathId = decoded.match(/\/(\d+)\/?$/)?.[1]
  if (pathId) return pathId

  return createHash("sha256").update(url.href).digest("hex").slice(0, 24)
}

function discoverHtmlJobs(source: PhdImportSourceDefinition, html: string) {
  const $ = load(html)
  const jobs = new Map<string, DiscoveredJob>()

  $("a[href]").each((_, element) => {
    const rawTitle = normalizeWhitespace($(element).text())
    const href = $(element).attr("href")
    if (!href || !isPhdTitle(rawTitle)) return

    const url = new URL(href, source.sourceUrl).toString()
    if (!isApprovedJobUrl(source, url)) return

    const context = normalizeWhitespace(
      $(element).closest("li, article, tr, [class*='job'], [class*='vacan']").first().text() ||
      $(element).parent().text()
    )

    jobs.set(url, {
      title: normalizeTitle(rawTitle),
      url,
      deadline: extractDeadline(context),
    })
  })

  return Array.from(jobs.values()).slice(0, MAX_JOBS_PER_SOURCE)
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

  return Array.from(jobs.values()).slice(0, MAX_JOBS_PER_SOURCE)
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

  return jobs.slice(0, MAX_JOBS_PER_SOURCE)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildDescription($: CheerioAPI, source: PhdImportSourceDefinition, externalUrl: string) {
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
    `<strong>Official university vacancy imported from ${escapeHtml(source.organization)}.</strong> `,
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

function inferSubject(title: string, bodyText: string) {
  const labelled = extractLabelledValue(
    bodyText,
    ["third-cycle subject", "third-cycle subject area", "subject area", "research field"],
    ["admission", "project description", "description", "duties", "qualifications", "employment", "location", "scope"]
  )
  if (labelled && labelled.length <= 100) {
    return labelled.replace(/^(?:area|subject)\s+/i, "")
  }

  const titleSubject = subjectRules.find(([pattern]) => pattern.test(title))?.[1]
  if (titleSubject) return titleSubject

  return subjectRules.find(([pattern]) => pattern.test(bodyText.slice(0, 5_000)))?.[1] || "Research"
}

function inferLocation(source: PhdImportSourceDefinition, bodyText: string) {
  const labelled = extractLabelledValue(
    bodyText,
    ["study location", "campus location", "place of work", "placement", "location", "city", "town"],
    ["school", "third-cycle subject", "county", "country", "reference number", "scope", "contract type", "salary", "published", "last application date"]
  )
  if (!labelled || labelled.length > 80) return source.defaultLocation
  return /sweden/i.test(labelled) ? labelled : `${labelled}, Sweden`
}

function isExpired(deadline: string) {
  const endOfDeadline = new Date(`${deadline}T23:59:59Z`)
  return endOfDeadline.valueOf() < Date.now()
}

async function parseJobDetail(
  source: PhdImportSourceDefinition,
  discovered: DiscoveredJob
): Promise<PhdImportCandidate | null> {
  const response = await fetchApprovedSourceText(source, discovered.url)
  const $ = load(response.text)
  const title = normalizeTitle($("h1").first().text() || discovered.title)
  if (!isPhdTitle(title)) return null

  $("script, style, noscript, iframe, svg").remove()
  const bodyText = normalizeWhitespace($("body").text())
  const deadline = extractDeadline(bodyText) || discovered.deadline
  if (!deadline || isExpired(deadline)) return null

  const publishedAt = extractPublishedAt(bodyText)

  return {
    externalId: extractExternalId(response.finalUrl),
    title,
    organization: source.organization,
    location: inferLocation(source, bodyText),
    subject: inferSubject(title, bodyText),
    description: buildDescription($, source, response.finalUrl),
    deadline,
    publishedAt,
    compensation: "paid",
    externalUrl: response.finalUrl,
    sourceId: source.id,
    sourceName: source.name,
    sourceMetadata: {
      country: source.country,
      platform: source.platform,
      sourcePage: source.publicUrl,
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

export async function scrapeUniversityPhdSource(source: PhdImportSourceDefinition) {
  const listing = await fetchApprovedSourceText(source, source.sourceUrl, {
    maxBytes: source.platform === "sitemap" ? 8 * 1024 * 1024 : undefined,
    timeoutMs: source.platform === "sitemap" ? 25_000 : undefined,
  })

  const discovered =
    source.platform === "feed"
      ? discoverFeedJobs(source, listing.text)
      : source.platform === "sitemap"
        ? discoverSitemapJobs(source, listing.text)
        : discoverHtmlJobs(source, listing.text)

  const detailResults = await mapWithConcurrency(discovered, DETAIL_CONCURRENCY, (job) =>
    parseJobDetail(source, job)
  )
  const candidates = detailResults.flatMap((result) =>
    result.status === "fulfilled" && result.value ? [result.value] : []
  )
  const errors = detailResults.flatMap((result) =>
    result.status === "rejected"
      ? [result.reason instanceof Error ? result.reason.message : "Unable to parse a vacancy"]
      : []
  )

  return {
    candidates,
    discovered: discovered.length,
    errors,
  }
}
