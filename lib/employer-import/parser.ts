import "server-only"
import { load } from "cheerio"
import { createHash } from "node:crypto"
import { employerFetcher } from "./fetch"
import { canonicalJobUrl, classifyEmployerTitle, isoDeadline } from "./identity"
import { inferDuration, inferTraineeFields } from "../trainee-import/classify"
import type { EmployerSource } from "./catalogue"
import type { EmployerCandidate, EmployerCursor, ListingJob } from "./types"

const QUERIES = ["thesis", "intern", "trainee", "graduate programme", "Abschlussarbeit", "Praktikum", "examensarbete", "masteroppgave", "diplomityö", "afstudeer"]
const COUNTRIES = /\b(sweden|sverige|norway|norge|finland|suomi|denmark|danmark|netherlands|nederland|germany|deutschland|se|no|fi|dk|nl|de)\b/i
const EXPIRED = /\b(no longer available|no longer accepting|applications? (?:are )?closed|vacancy (?:has )?expired|position (?:has been|is) filled)\b/i
const PAGE_SIZE = 20
type Json = Record<string, any> // External ATS payloads are validated field by field below.
const text = (value: unknown): string => typeof value === "string" ? load(`<body>${value}</body>`)("body").text().replace(/\s+/g, " ").trim() : ""

export function jobPostings(value: unknown): Json[] {
  if (Array.isArray(value)) return value.flatMap(jobPostings)
  if (!value || typeof value !== "object") return []
  const item = value as Json
  if ([item["@type"]].flat().includes("JobPosting")) return [item]
  return [...jobPostings(item["@graph"]), ...jobPostings(item.itemListElement), ...jobPostings(item.item)]
}

export function htmlJobs(body: string, base: string) {
  const $ = load(body)
  const jobs: ListingJob[] = []
  $("script[type='application/ld+json']").each((_, node) => {
    try {
      for (const item of jobPostings(JSON.parse($(node).text()))) {
        const url = new URL(item.url || base, base).toString()
        jobs.push({ id: String(item.identifier?.value || url), url, title: text(item.title), organization: text(item.hiringOrganization?.name), description: item.description, deadline: item.validThrough, publishedAt: item.datePosted,
          location: [item.jobLocation].flat().map(loc => [loc?.address?.addressLocality, loc?.address?.addressCountry?.name || loc?.address?.addressCountry].filter(v => typeof v === "string").join(", ")).join("; ") })
      }
    } catch { /* A malformed unrelated JSON-LD block must not abort the page. */ }
  })
  $("a[href]").each((_, node) => {
    const href = $(node).attr("href")!
    try {
      const url = new URL(href, base).toString()
      // Match vacancy paths, never words in a hostname or a careers guide URL.
      if (!/\/(?:jobs?|jobdetail|vacanc(?:y|ies)|vacatures?|positions?|stellen(?:angebote)?|requisition|apply)\/[^/?#]+/i.test(new URL(url).pathname)) return
      if (canonicalJobUrl(url) === canonicalJobUrl(base)) return
      let title = text($(node).text())
      const row = $(node).closest("tr")
      if (!classifyEmployerTitle(title) && row.length) title = text(row.find(".views-field-title,[itemprop='title']").first().text())
      if (!classifyEmployerTitle(title)) {
        // Some vacancy cards use an empty overlay link or a "Read more" button.
        let container = $(node).parent()
        for (let depth = 0; depth < 5; depth++, container = container.parent()) {
          const headings = container.find("h2,h3,h4")
          if (headings.length === 1) { title = text(headings.first().text()); break }
          if (headings.length > 1) break
        }
      }
      if (!classifyEmployerTitle(title)) return
      jobs.push({ id: url, url, title })
    } catch { /* Ignore non-web links. */ }
  })
  const nextHref = $("a[rel='next'],a[aria-label='Next'],a[aria-label='Next page'],a.pagination-next,a.next").first().attr("href")
  return { jobs, nextPage: nextHref ? new URL(nextHref, base).toString() : undefined }
}

function nextCursor(cursor: EmployerCursor, more: boolean, increment = PAGE_SIZE, queries = QUERIES.map((_, i) => i)): EmployerCursor {
  return more ? { query: cursor.query, offset: cursor.offset + increment } : { query: queries[(queries.indexOf(cursor.query) + 1) % queries.length], offset: 0 }
}

export async function scanEmployerPage(source: EmployerSource, cursor: EmployerCursor, known: Set<string>, section?: "master" | "trainee"): Promise<{ candidates: EmployerCandidate[]; duplicates: number; excluded: number; found: number; errors: string[]; cursor: EmployerCursor }> {
  const queries = section === "trainee" ? [2, 3] : section === "master" ? [0, 1, 4, 5, 6, 7, 8, 9] : QUERIES.map((_, i) => i)
  if (!queries.includes(cursor.query)) cursor = { query: queries[0], offset: 0 }
  const advance = (more: boolean, increment = PAGE_SIZE) => nextCursor(cursor, more, increment, queries)
  const read = employerFetcher(source)
  const listingUrl = source.listingUrl || source.publicUrl
  const base = new URL(listingUrl)
  const query = QUERIES[cursor.query % QUERIES.length]
  let jobs: ListingJob[] = []
  let next: EmployerCursor = { query: 0, offset: 0 }
  if (source.adapter === "workday") {
    const endpoint = `${base.origin}/wday/cxs/${source.tenant}/${source.board}`
    const result = JSON.parse((await read(`${endpoint}/jobs`, { method: "POST", body: JSON.stringify({ appliedFacets: {}, limit: PAGE_SIZE, offset: cursor.offset, searchText: query }) })).text)
    if (!Array.isArray(result.jobPostings)) throw new Error("Workday search response changed")
    jobs = result.jobPostings.map((item: Json) => ({ id: String(item.bulletFields?.[0] || item.externalPath), title: text(item.title), url: `${base.origin}/${source.board}${item.externalPath}`, location: text(item.locationsText), detailUrl: `${endpoint}${item.externalPath}` }))
    next = advance(cursor.offset + jobs.length < Number(result.total))
  } else if (source.adapter === "smartrecruiters") {
    const endpoint = `https://api.smartrecruiters.com/v1/companies/${source.tenant}/postings`
    const result = JSON.parse((await read(`${endpoint}?limit=${PAGE_SIZE}&offset=${cursor.offset}&q=${encodeURIComponent(query)}`)).text)
    if (!Array.isArray(result.content)) throw new Error("SmartRecruiters search response changed")
    jobs = result.content.map((item: Json) => ({ id: String(item.id), title: text(item.name), url: `https://jobs.smartrecruiters.com/${source.tenant}/${item.id}`, detailUrl: `${endpoint}/${item.id}`, location: text(item.location?.fullLocation || [item.location?.city, item.location?.country].filter(Boolean).join(", ")), country: item.location?.country, publishedAt: item.releasedDate }))
    next = advance(cursor.offset + jobs.length < Number(result.totalFound))
  } else if (source.adapter === "eightfold") {
    const endpoint = new URL("/api/pcsx/search", base)
    endpoint.search = new URLSearchParams({ domain: source.tenant!, query, start: String(cursor.offset), num: String(PAGE_SIZE), sort_by: "relevance" }).toString()
    const result = JSON.parse((await read(endpoint.toString())).text)
    if (!Array.isArray(result.data?.positions)) throw new Error("Eightfold search response changed")
    jobs = result.data.positions.map((item: Json) => ({ id: String(item.displayJobId || item.id), title: text(item.name), url: new URL(item.positionUrl || `/careers/job/${item.id}`, base).toString(), location: (item.locations || []).join("; "), publishedAt: item.postedTs ? new Date(item.postedTs * 1000).toISOString() : undefined }))
    next = advance(jobs.length > 0 && cursor.offset + jobs.length < Number(result.data.count ?? result.data.totalCount ?? (cursor.offset + jobs.length + 1)), jobs.length || PAGE_SIZE)
  } else {
    const url = new URL(cursor.pageUrl || listingUrl)
    if (source.adapter === "successfactors") {
      url.pathname = "/search/"
      url.search = new URLSearchParams({ q: query, startrow: String(cursor.offset) }).toString()
    }
    if (source.adapter === "avature") url.search = new URLSearchParams({ search: query, jobOffset: String(cursor.offset), jobRecordsPerPage: String(PAGE_SIZE) }).toString()
    const result = await read(url.toString())
    if (source.adapter === "html" && !source.verified) {
      // Discover only public Workday links actually supplied by the official career page.
      // The guarded fetcher still checks the exact discovered hostname and every resolved IP.
      const $page = load(result.text)
      const workday = $page("a[href]").map((_, node) => $page(node).attr("href")).get().find(href => {
        try { return new URL(href, result.finalUrl).hostname.match(/^[a-z0-9-]+\.wd\d+\.myworkdayjobs\.com$/) } catch { return false }
      })
      if (workday) {
        const target = new URL(workday, result.finalUrl)
        const parts = target.pathname.split("/").filter(Boolean)
        if (/^[a-z]{2}-[a-z]{2}$/i.test(parts[0])) parts.shift()
        if (parts[0] && /^[\w-]+$/.test(parts[0])) return scanEmployerPage({ ...source, adapter: "workday", tenant: target.hostname.split(".")[0], board: parts[0], listingUrl: `${target.origin}/${parts[0]}`, allowedHosts: [...source.allowedHosts, target.hostname] }, cursor, known, section)
      }
    }
    const parsed = htmlJobs(result.text, result.finalUrl)
    jobs = source.adapter === "successfactors" || source.adapter === "avature" ? parsed.jobs : parsed.jobs.slice(cursor.offset, cursor.offset + PAGE_SIZE)
    if (source.adapter === "successfactors") {
      // SuccessFactors usually has 25 rows; use the real table count, not matches.
      const $listing = load(result.text)
      const rowCount = new Set($listing("a.jobTitle-link").map((_, node) => $listing(node).attr("href")).get()).size
      next = advance(rowCount >= 25, rowCount || 25)
    } else if (source.adapter === "avature") {
      const $listing = load(result.text)
      const rowCount = new Set($listing("a[href*='/JobDetail/']").map((_, node) => $listing(node).attr("href")).get()).size
      next = advance(rowCount >= PAGE_SIZE)
    } else if (parsed.jobs.length > cursor.offset + PAGE_SIZE) next = { ...cursor, offset: cursor.offset + PAGE_SIZE }
    else next = { query: 0, offset: 0, ...(parsed.nextPage ? { pageUrl: parsed.nextPage } : {}) }
    if (!parsed.jobs.length && !source.verified) throw new Error("No structured vacancy feed found at this career page; a direct job-search endpoint needs configuration")
  }
  const unique = new Map<string, ListingJob>()
  for (const job of jobs) {
    try { if (job.title && job.url && !unique.get(canonicalJobUrl(job.url))?.description) unique.set(canonicalJobUrl(job.url), job) } catch { /* Malformed provider entry. */ }
  }
  const candidates: EmployerCandidate[] = []
  const errors: string[] = []
  let duplicates = 0
  let excluded = 0
  for (const [url, job] of unique) {
    const kind = classifyEmployerTitle(job.title)
    if (!kind) { excluded++; continue }
    if (known.has(url) || known.has(`${source.id}:${job.id}`)) { duplicates++; continue }
    if (job.country && !COUNTRIES.test(job.country)) { excluded++; continue }
    try {
      let description = job.description || ""
      let deadline = job.deadline
      let location = job.location || ""
      let publishedAt = job.publishedAt
      let organization = job.organization || source.name
      if (source.adapter === "workday") {
        const detail = JSON.parse((await read(job.detailUrl!)).text).jobPostingInfo
        if (!detail?.jobDescription) throw new Error("Workday detail is missing the description")
        if (detail.canApply === false || detail.posted === false) { excluded++; continue }
        description = detail.jobDescription
        deadline = detail.endDate
        publishedAt = detail.startDate
        const country = text(detail.country?.descriptor || detail.jobRequisitionLocation?.country?.alpha2Code)
        location = [detail.location, ...(detail.additionalLocations || []).map((item: unknown) => typeof item === "string" ? item : text((item as Json)?.descriptor)), country].filter(Boolean).join("; ")
      } else if (source.adapter === "smartrecruiters") {
        const detail = JSON.parse((await read(job.detailUrl!)).text)
        description = Object.values(detail.jobAd?.sections || {}).map((section: any) => section.text || "").join("\n")
        deadline = detail.validThrough
      } else if (!description) {
        const detail = await read(url)
        const parsed = htmlJobs(detail.text, detail.finalUrl).jobs.find(item => item.description)
        organization = parsed?.organization || organization
        const $ = load(detail.text)
        $("script,style,nav,header,footer,form").remove()
        description = parsed?.description || $("[itemprop='description'],.jobdescription,.job-description,.jobDescription,article,main").first().text()
        deadline = parsed?.deadline || $("[itemprop='validThrough']").attr("content")
        location = parsed?.location || $("[itemprop='streetAddress']").attr("content") || text($(".jobGeoLocation").first().text()) || location
        publishedAt = parsed?.publishedAt || $("[itemprop='datePosted']").attr("content") || publishedAt
        if (source.adapter === "avature") {
          location = text($(".tf_locations .article__content__view__field__value").text()) || location
          const descriptions = $(".article__content__view__field").filter((_, node) => !$(node).find(".article__content__view__field__label").length)
            .map((_, node) => text($(node).find(".article__content__view__field__value").text())).get().sort((a, b) => b.length - a.length)
          description = descriptions[0] || description
        }
      }
      const clean = text(description)
      if (EXPIRED.test(clean)) { excluded++; continue }
      if (clean.length < 100) throw new Error("Vacancy description unavailable; page may require a different adapter")
      if (location && !COUNTRIES.test(location)) { excluded++; continue }
      // Do not manufacture a country when a multinational listing has no location.
      if (!location) location = "Location not specified — verify on employer site"
      const date = isoDeadline(deadline) || isoDeadline(clean.match(/(?:deadline|closing date|sista ansokningsdag|sista ansökningsdag|bewerbungsfrist)\s*:?\s*(.{0,45})/i)?.[1])
      if (date && date < new Date().toISOString().slice(0, 10)) { excluded++; continue }
      const compensation = /\bunpaid\b/i.test(clean) ? "unpaid" : /\bstipend\b/i.test(clean) ? "stipend" : /\bpaid (?:internship|placement|position)|\bsalary\s*[:€£]|\bremuneration\s*:/i.test(clean) ? "paid" : null
      candidates.push({ externalId: job.id.length <= 200 ? job.id : createHash("sha256").update(url).digest("hex"), url, title: job.title.slice(0, 300), kind, organization, location: location.slice(0, 500), description: clean.slice(0, 20_000), field: inferTraineeFields(job.title, clean).join(", "), deadline: date, compensation, duration: inferDuration(clean), publishedAt: isoDeadline(publishedAt) })
    } catch (error) { errors.push(`${job.title.slice(0, 80)}: ${error instanceof Error ? error.message : "Vacancy detail request failed"}`) }
  }
  // Retry a partially read page twice, then advance; a permanently broken detail must not
  // prevent discovery of every later page. It will be tried again on the next search cycle.
  return { candidates, duplicates, excluded, found: unique.size, errors, cursor: errors.length && (cursor.retry || 0) < 2 ? { ...cursor, retry: (cursor.retry || 0) + 1 } : next }
}
