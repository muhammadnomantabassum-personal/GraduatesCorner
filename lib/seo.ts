import type { Metadata } from "next"
import { htmlToPlainText } from "@/lib/text"

export const SITE_NAME = "Graduates Corner"
export const SITE_URL = "https://graduatescorner.com"
export const SITE_DESCRIPTION =
  "Discover current PhD positions, master's thesis opportunities, and graduate trainee programs from universities, research institutes, and companies worldwide."

export const SOCIAL_PROFILES = [
  "https://www.linkedin.com/company/graduatescorner/",
  "https://github.com/muhammadnomantabassum-personal",
]

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString()
}

function truncate(value: string, length = 158) {
  const clean = htmlToPlainText(value)
  if (clean.length <= length) return clean

  const shortened = clean.slice(0, length + 1)
  const lastSpace = shortened.lastIndexOf(" ")
  return `${shortened.slice(0, lastSpace > 90 ? lastSpace : length).trim()}...`
}

export function createPageMetadata({
  title,
  description,
  path,
  keywords = [],
  image = "/og-image.png?v=4",
  type = "website",
  noIndex = false,
}: {
  title: string
  description: string
  path: string
  keywords?: string[]
  image?: string
  type?: "website" | "article"
  noIndex?: boolean
}): Metadata {
  const canonical = absoluteUrl(path)
  const summary = truncate(description)
  const socialTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`

  return {
    title,
    description: summary,
    keywords,
    alternates: {
      canonical,
      languages: {
        en: canonical,
        "x-default": canonical,
      },
    },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      title: socialTitle,
      description: summary,
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_US",
      type,
      images: [
        {
          url: absoluteUrl(image),
          width: 1200,
          height: 630,
          alt: socialTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: summary,
      images: [absoluteUrl(image)],
    },
  }
}

function parseLocation(value: string) {
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)

  return {
    locality: parts.length > 1 ? parts.slice(0, -1).join(", ") : parts[0] || value,
    country: parts.length > 1 ? parts[parts.length - 1] : parts[0] || value,
  }
}

type JobSchemaInput = {
  id: string
  title: string
  description: string
  organization: string
  location: string
  deadline: string
  createdAt: string
  path: string
  field: string
  kind: "phd" | "trainee"
}

export function buildJobPostingSchema(input: JobSchemaInput) {
  const location = parseLocation(input.location)
  const remote = /remote|online|worldwide/i.test(input.location)

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${absoluteUrl(input.path)}#job`,
    title: input.title,
    description: htmlToPlainText(input.description),
    identifier: {
      "@type": "PropertyValue",
      name: SITE_NAME,
      value: input.id,
    },
    datePosted: input.createdAt,
    validThrough: `${input.deadline}T23:59:59+00:00`,
    employmentType: input.kind === "phd" ? "FULL_TIME" : "INTERN",
    industry: input.field,
    hiringOrganization: {
      "@type": "Organization",
      name: input.organization,
    },
    ...(remote
      ? { jobLocationType: "TELECOMMUTE" }
      : {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: location.locality,
              addressCountry: location.country,
            },
          },
        }),
    url: absoluteUrl(input.path),
    directApply: false,
  }
}

export function buildThesisSchema(input: {
  id: string
  title: string
  description: string
  organization: string
  location: string
  deadline: string
  createdAt: string
  field: string
}) {
  const path = `/theses/${input.id}`

  return {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    "@id": `${absoluteUrl(path)}#program`,
    name: input.title,
    description: htmlToPlainText(input.description),
    provider: {
      "@type": "Organization",
      name: input.organization,
    },
    occupationalCategory: input.field,
    applicationDeadline: input.deadline,
    dateCreated: input.createdAt,
    url: absoluteUrl(path),
    educationalProgramMode: /remote|online/i.test(input.location) ? "online" : "onsite",
  }
}

export function buildArticleSchema(input: {
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  createdAt: string
  coverImage?: string | null
}) {
  const path = `/blog/${input.slug}`

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${absoluteUrl(path)}#article`,
    headline: input.title,
    description: truncate(input.excerpt),
    articleBody: htmlToPlainText(input.content),
    datePublished: input.createdAt,
    dateModified: input.createdAt,
    mainEntityOfPage: absoluteUrl(path),
    image: absoluteUrl(input.coverImage || "/og-image.png?v=4"),
    author: {
      "@type": "Person",
      name: input.author,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.png"),
      },
    },
  }
}

export function buildBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}
