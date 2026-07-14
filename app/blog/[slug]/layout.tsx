import type { Metadata } from "next"
import { JsonLd } from "@/components/seo/json-ld"
import { buildArticleSchema, buildBreadcrumbSchema, createPageMetadata } from "@/lib/seo"
import { getSeoBlogPost } from "@/lib/seo-data"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getSeoBlogPost(slug)

  if (!post) {
    return createPageMetadata({
      title: "Article Not Found",
      description: "This Graduates Corner article is not currently available.",
      path: `/blog/${slug}`,
      noIndex: true,
    })
  }

  return createPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    image: post.cover_image || "/og-image.png?v=4",
    type: "article",
    keywords: [post.category, "graduate career advice", "academic opportunities"],
  })
}

export default async function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getSeoBlogPost(slug)

  return (
    <>
      {post ? (
        <JsonLd
          data={[
            buildArticleSchema({
              slug: post.slug,
              title: post.title,
              excerpt: post.excerpt,
              content: post.content,
              author: post.author,
              createdAt: post.created_at,
              coverImage: post.cover_image,
            }),
            buildBreadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Career Guides", path: "/blog" },
              { name: post.title, path: `/blog/${post.slug}` },
            ]),
          ]}
        />
      ) : null}
      {children}
    </>
  )
}
