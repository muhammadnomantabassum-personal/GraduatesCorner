import type { MetadataRoute } from "next"
import { getSeoIndexRecords } from "@/lib/seo-data"
import { absoluteUrl } from "@/lib/seo"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { theses, programs, posts } = await getSeoIndexRecords()
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/phd-positions"), changeFrequency: "daily", priority: 0.95 },
    { url: absoluteUrl("/master-thesis"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/trainee-programs"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/faq"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/press"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/testimonials"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/privacy-policy"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms-of-service"), changeFrequency: "yearly", priority: 0.2 },
  ]

  const thesisPages: MetadataRoute.Sitemap = theses.map((thesis) => ({
    url: absoluteUrl(thesis.type === "phd" ? `/phd-positions/${thesis.id}` : `/theses/${thesis.id}`),
    lastModified: new Date(thesis.created_at),
    changeFrequency: "weekly",
    priority: thesis.type === "phd" ? 0.85 : 0.75,
  }))
  const programPages: MetadataRoute.Sitemap = programs.map((program) => ({
    url: absoluteUrl(`/trainee-programs/${program.id}`),
    lastModified: new Date(program.created_at),
    changeFrequency: "weekly",
    priority: 0.75,
  }))
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.created_at),
    changeFrequency: "monthly",
    priority: 0.65,
  }))

  return [...staticPages, ...thesisPages, ...programPages, ...blogPages]
}
