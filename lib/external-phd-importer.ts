export type ExternalPhdCandidate = {
  id: string
  title: string
  organization: string
  organizationType: "university" | "company"
  location: string
  subject: string
  description: string
  deadline: string
  compensation: "paid" | "unpaid" | "stipend"
  externalUrl: string
  sourceName: string
}

type FeedItem = {
  title: string
  link: string
  description: string
  published?: string
  categories: string[]
}

const fallbackSubjects = [
  "Computer Science",
  "Engineering",
  "Physics",
  "Biology",
  "Chemistry",
  "Mathematics",
  "Medicine",
  "Economics",
  "Social Sciences",
  "Environmental Science",
]

export async function fetchExternalPhdCandidates(feedUrls: string[]) {
  const uniqueFeeds = Array.from(new Set(feedUrls.map((url) => url.trim()).filter(Boolean)))
  const batches = await Promise.allSettled(uniqueFeeds.map((url) => fetchFeed(url)))

  return batches.flatMap((result) => result.status === "fulfilled" ? result.value : [])
}

async function fetchFeed(feedUrl: string): Promise<ExternalPhdCandidate[]> {
  const response = await fetch(feedUrl, {
    headers: {
      "accept": "application/rss+xml, application/atom+xml, application/feed+json, application/json, text/xml, */*",
      "user-agent": "GraduatesCorner opportunity importer",
    },
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${feedUrl}: ${response.status}`)
  }

  const text = await response.text()
  const sourceName = inferSourceName(feedUrl, text)
  const items = text.trim().startsWith("{")
    ? parseJsonFeed(text)
    : parseXmlFeed(text)

  return items
    .filter((item) => isPhdLike(item.title, item.description, item.categories))
    .map((item) => toCandidate(item, sourceName))
    .filter((item) => item.title && item.externalUrl)
    .slice(0, 40)
}

function parseJsonFeed(text: string): FeedItem[] {
  try {
    const json = JSON.parse(text)
    const items = Array.isArray(json.items) ? json.items : []
    return items.map((item: any) => ({
      title: String(item.title || ""),
      link: String(item.url || item.external_url || ""),
      description: stripHtml(String(item.summary || item.content_text || item.content_html || "")),
      published: item.date_published,
      categories: Array.isArray(item.tags) ? item.tags.map(String) : [],
    }))
  } catch {
    return []
  }
}

function parseXmlFeed(text: string): FeedItem[] {
  const itemBlocks = matchBlocks(text, "item")
  const entryBlocks = matchBlocks(text, "entry")
  const blocks = itemBlocks.length > 0 ? itemBlocks : entryBlocks

  return blocks.map((block) => ({
    title: decodeXml(readTag(block, "title")),
    link: decodeXml(readLink(block)),
    description: stripHtml(decodeXml(readTag(block, "description") || readTag(block, "summary") || readTag(block, "content:encoded") || readTag(block, "content"))),
    published: decodeXml(readTag(block, "pubDate") || readTag(block, "published") || readTag(block, "updated")),
    categories: matchTags(block, "category").map(decodeXml),
  }))
}

function toCandidate(item: FeedItem, sourceName: string): ExternalPhdCandidate {
  const text = `${item.title} ${item.description} ${item.categories.join(" ")}`
  const deadline = extractDeadline(text)
  const subject = inferSubject(text, item.categories)
  const location = inferLocation(text)
  const organization = inferOrganization(item.title, sourceName)
  const description = [
    item.description || item.title,
    "",
    `Imported from ${sourceName}. Please verify all details before applying.`,
    deadline.inferred ? "Deadline was inferred because the source feed did not provide a clear application deadline." : "",
  ].filter(Boolean).join("\n")

  return {
    id: stableId(item.link || item.title),
    title: normalizeTitle(item.title),
    organization,
    organizationType: "university",
    location,
    subject,
    description,
    deadline: deadline.value,
    compensation: /funded|salary|stipend|paid|scholarship/i.test(text) ? "stipend" : "unpaid",
    externalUrl: item.link,
    sourceName,
  }
}

function matchBlocks(text: string, tag: string) {
  return Array.from(text.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"))).map((match) => match[1])
}

function matchTags(text: string, tag: string) {
  return Array.from(text.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"))).map((match) => match[1].trim())
}

function readTag(text: string, tag: string) {
  return text.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1]?.trim() || ""
}

function readLink(text: string) {
  const rssLink = readTag(text, "link")
  if (rssLink) return rssLink
  return text.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] || ""
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function isPhdLike(title: string, description: string, categories: string[]) {
  const text = `${title} ${description} ${categories.join(" ")}`.toLowerCase()
  return /\b(phd|doctoral|doctorate|doctoral candidate|research fellow|early stage researcher)\b/.test(text)
}

function inferSourceName(feedUrl: string, text: string) {
  const feedTitle = decodeXml(readTag(text, "title"))
  if (feedTitle && feedTitle.length < 80) return feedTitle
  try {
    return new URL(feedUrl).hostname.replace(/^www\./, "")
  } catch {
    return "External source"
  }
}

function inferOrganization(title: string, sourceName: string) {
  const splitters = [" at ", " - ", " | ", " – "]
  for (const splitter of splitters) {
    const parts = title.split(splitter)
    if (parts.length > 1) {
      const org = parts[parts.length - 1].trim()
      if (org.length >= 3 && org.length <= 80) return org
    }
  }
  return sourceName
}

function inferSubject(text: string, categories: string[]) {
  const categorySubject = categories.find((category) => category.length > 2 && category.length < 40)
  if (categorySubject) return categorySubject
  return fallbackSubjects.find((subject) => new RegExp(subject.replace(/\s+/g, "\\s+"), "i").test(text)) || "Research"
}

function inferLocation(text: string) {
  const locationMatch = text.match(/\b(?:location|country|city):\s*([A-Za-zÅÄÖåäöÉéÈèÜü ,.-]{3,60})/i)
  return locationMatch?.[1]?.trim().replace(/[.;,]$/, "") || "See source"
}

function extractDeadline(text: string): { value: string; inferred: boolean } {
  const iso = text.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/)
  if (iso) {
    return {
      value: `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`,
      inferred: false,
    }
  }

  const monthDate = text.match(/\b(0?[1-9]|[12]\d|3[01])\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i)
  if (monthDate) {
    const month = new Date(`${monthDate[2]} 1, ${monthDate[3]}`).getMonth() + 1
    return {
      value: `${monthDate[3]}-${String(month).padStart(2, "0")}-${monthDate[1].padStart(2, "0")}`,
      inferred: false,
    }
  }

  const fallback = new Date()
  fallback.setDate(fallback.getDate() + 90)
  return { value: fallback.toISOString().slice(0, 10), inferred: true }
}

function normalizeTitle(title: string) {
  return stripHtml(title).replace(/\s+/g, " ").slice(0, 150)
}

function stableId(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0
  }
  return `external-${Math.abs(hash)}`
}
