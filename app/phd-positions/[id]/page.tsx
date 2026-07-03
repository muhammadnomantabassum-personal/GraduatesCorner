import type { Metadata } from "next"
import { getPhdShareData, getPhdShareImageUrl, siteUrl } from "@/lib/opportunity-share"

export { default } from "@/app/theses/[id]/page"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const position = await getPhdShareData(id)
  const url = new URL(`/phd-positions/${id}`, siteUrl).toString()
  const imageUrl = getPhdShareImageUrl(id)

  if (!position) {
    return {
      title: "PhD Position | Graduates Corner",
      description: "Explore PhD positions from universities and research-focused organizations.",
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: "PhD Position | Graduates Corner",
        description: "Explore PhD positions from universities and research-focused organizations.",
        url,
        siteName: "Graduates Corner",
        type: "website",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: "Graduates Corner PhD position",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "PhD Position | Graduates Corner",
        description: "Explore PhD positions from universities and research-focused organizations.",
        images: [imageUrl],
      },
    }
  }

  const title = `${position.title} | ${position.organization}`
  const description =
    position.description ||
    `Explore this PhD position from ${position.organization} on Graduates Corner.`

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Graduates Corner",
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${position.organization} PhD position`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}
