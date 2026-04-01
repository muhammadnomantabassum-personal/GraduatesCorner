"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { PublicLayout } from "@/components/layout/public-layout"
import { BlogCard } from "@/components/shared/blog-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { BlogPost } from "@/lib/data/types"
import { ArrowLeft, Calendar, Clock, User, Loader2 } from "lucide-react"
import Image from "next/image"

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)
      
      let query = supabase.from('blog_posts').select('*')
      
      if (slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        query = query.or(`slug.eq.${slug},id.eq.${slug}`)
      } else {
        query = query.eq('slug', slug)
      }

      const { data, error } = await query.single()

      if (error) {
        console.error('Error fetching blog post:', error)
      } else if (data) {
        const formattedPost: BlogPost = {
          id: data.id,
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          author: data.author,
          category: data.category,
          coverImage: data.cover_image,
          createdAt: data.created_at,
          readTime: data.read_time,
          status: data.status,
          postedByUserId: data.posted_by_user_id,
        }
        setPost(formattedPost)

        // Fetch related posts
        const { data: relatedData } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'approved')
          .eq('category', data.category)
          .neq('id', data.id)
          .limit(3)

        if (relatedData) {
          setRelatedPosts(relatedData.map((p: any) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
            content: p.content,
            author: p.author,
            category: p.category,
            coverImage: p.cover_image,
            createdAt: p.created_at,
            readTime: p.read_time,
            status: p.status,
            postedByUserId: p.posted_by_user_id,
          })))
        }
      }
      setLoading(false)
    }

    fetchPost()
  }, [slug, supabase])

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading article...</p>
        </div>
      </PublicLayout>
    )
  }

  if (!post) {
    return (
      <PublicLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
          <h1 className="mb-4 text-2xl font-bold text-foreground">Article Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            The blog post you are looking for does not exist.
          </p>
          <Link href="/blog">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Blog
            </Button>
          </Link>
        </div>
      </PublicLayout>
    )
  }

  // Check if content is HTML (from TipTap) or plain text/markdown (older posts)
  const isHtml = post.content.trim().startsWith('<')

  return (
    <PublicLayout>
      <article>
        <section className="border-b border-border bg-primary px-4 py-10 text-primary-foreground lg:py-14">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/blog"
              className="mb-4 inline-flex items-center gap-2 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Blog
            </Link>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h1 className="text-balance text-3xl font-bold lg:text-4xl">{post.title}</h1>
              <Badge
                variant="secondary"
                className="shrink-0 bg-primary-foreground/15 text-primary-foreground"
              >
                {post.category}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-primary-foreground/80">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" /> {post.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />{" "}
                {new Date(post.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {post.readTime}
              </span>
            </div>
          </div>
        </section>

        <section className="px-4 py-10 lg:py-14">
          <div className="mx-auto max-w-3xl">
            {post.coverImage && (
              <div className="relative mb-10 aspect-[21/9] w-full overflow-hidden rounded-xl border bg-muted shadow-lg">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
            
            <div className="prose prose-lg max-w-none text-muted-foreground prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground">
              {isHtml ? (
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              ) : (
                <div className="whitespace-pre-wrap">{post.content}</div>
              )}
            </div>
          </div>
        </section>
      </article>

      {relatedPosts.length > 0 && (
        <section className="border-t border-border bg-secondary/50 px-4 py-12">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-6 text-xl font-semibold text-foreground">Related Articles</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  )
}
