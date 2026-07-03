"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { PublicLayout } from "@/components/layout/public-layout"
import { BlogCard } from "@/components/shared/blog-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { BlogPost } from "@/lib/data/types"
import { sanitizeHtml } from "@/lib/sanitize-html"
import { ArrowLeft, Calendar, Clock, Loader2, Copy, Check } from "lucide-react"
import Image from "next/image"

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [isCopied, setIsCopied] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)
      
      let query = supabase.from('blog_posts').select('*, profiles(avatar)')
      
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
          authorAvatar: data.profiles?.avatar || undefined,
        }
        setPost(formattedPost)

        // Fetch related posts
        const { data: relatedData } = await supabase
          .from('blog_posts')
          .select('*, profiles(avatar)')
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
            authorAvatar: p.profiles?.avatar || undefined,
          })))
        }
      }
      setLoading(false)
    }

    fetchPost()
  }, [slug, supabase])

  // Check if content is HTML (from TipTap) or plain text/markdown (older posts)
  const isHtml = post?.content.trim().startsWith('<') ?? false
  const sanitizedContent = useMemo(
    () => (post ? (isHtml ? sanitizeHtml(post.content) : post.content) : ""),
    [isHtml, post]
  )

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

  const handleCopy = async () => {
    try {
      let textToCopy = post.content;
      
      if (isHtml) {
        // Use a temporary DOM element to reliably strips tags and parse HTML entities 
        const tempElement = document.createElement('div');
        tempElement.innerHTML = sanitizedContent;
        textToCopy = tempElement.textContent || tempElement.innerText || "";
      }
      textToCopy = textToCopy.trim();
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for older browsers or non-secure contexts (e.g. testing on LAN IP)
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy content:", err);
    }
  }

  return (
    <PublicLayout>
      <article className="pb-16 pt-8 lg:pb-24 lg:pt-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href="/blog"
            className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to articles
          </Link>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="relative mb-10 md:mb-14 aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-2xl md:rounded-3xl shadow-lg ring-1 ring-border/50">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                unoptimized
                className="object-cover"
                priority
              />
            </div>
          )}

        {/* Header */}
          <header className="mx-auto max-w-3xl mb-12">
            <h1 className="mb-8 text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl mt-4">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-y border-border py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-lg font-semibold text-foreground overflow-hidden">
                  {post.authorAvatar ? (
                    <Image src={post.authorAvatar} alt={post.author} width={44} height={44} className="h-full w-full object-cover" />
                  ) : (
                    post.author.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{post.author}</p>
                  <p className="text-xs">Author</p>
                </div>
              </div>
              
              <div className="hidden h-10 w-px bg-border sm:block"></div>
              
              <div className="flex flex-wrap items-center gap-5 sm:gap-6">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary hover:bg-primary/20"
                >
                  {post.category}
                </Badge>
              </div>
            </div>
          </header>
          
          {/* Content */}
          <div className="mx-auto max-w-3xl">
            <div className="prose prose-lg md:prose-xl max-w-none prose-headings:text-foreground prose-a:text-primary prose-a:font-semibold hover:prose-a:underline prose-strong:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground">
              {isHtml ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed">{post.content}</div>
              )}
            </div>

            {/* Copy Button */}
            <div className="mt-12 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-sm"
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Article
                  </>
                )}
              </Button>
            </div>
          </div>

        </div>
      </article>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-border bg-slate-50/50 dark:bg-slate-900/20 px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Related Articles</h2>
              <Link href="/blog" className="text-sm font-medium text-primary hover:underline">
                View all {"->"}
              </Link>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
