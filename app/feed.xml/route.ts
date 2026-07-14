import { getSeoIndexRecords } from "@/lib/seo-data"
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo"
import { htmlToPlainText } from "@/lib/text"

export const revalidate = 3600

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  const { theses, programs, posts } = await getSeoIndexRecords()
  const items = [
    ...theses.map((item) => ({
      title: item.title,
      description: `${htmlToPlainText(item.description).slice(0, 320)} - ${item.organization}`,
      url: absoluteUrl(item.type === "phd" ? `/phd-positions/${item.id}` : `/theses/${item.id}`),
      date: item.created_at,
      category: item.type === "phd" ? "PhD Position" : "Master's Thesis",
    })),
    ...programs.map((item) => ({
      title: item.title,
      description: `${htmlToPlainText(item.description).slice(0, 320)} - ${item.company}`,
      url: absoluteUrl(`/trainee-programs/${item.id}`),
      date: item.created_at,
      category: "Graduate Trainee Program",
    })),
    ...posts.map((item) => ({
      title: item.title,
      description: item.excerpt,
      url: absoluteUrl(`/blog/${item.slug}`),
      date: item.created_at,
      category: "Career Guide",
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50)

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${absoluteUrl("/")}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items
      .map(
        (item) => `<item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="true">${item.url}</guid>
      <description>${escapeXml(item.description)}</description>
      <category>${escapeXml(item.category)}</category>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
    </item>`
      )
      .join("\n    ")}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
