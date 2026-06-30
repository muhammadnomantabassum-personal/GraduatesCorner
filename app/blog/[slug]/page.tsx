"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { PublicLayout } from "@/components/layout/public-layout"
import { BlogCard } from "@/components/shared/blog-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import type { BlogComment, BlogPost } from "@/lib/data/types"
import { sanitizeHtml } from "@/lib/sanitize-html"
import { ArrowLeft, Calendar, Clock, User, Loader2, Copy, Check, MessageSquare, ShieldCheck, Send } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { user } = useAuth()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [comments, setComments] = useState<BlogComment[]>([])
  const [loading, setLoading] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [commentName, setCommentName] = useState("")
  const [commentEmail, setCommentEmail] = useState("")
  const [commentBody, setCommentBody] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [submittingComment, setSubmittingComment] = useState(false)

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

        const { data: commentData } = await supabase
          .from("blog_comments")
          .select("*")
          .eq("blog_post_id", data.id)
          .eq("status", "approved")
          .order("created_at", { ascending: false })

        if (commentData) {
          setComments(commentData.map((comment: any) => ({
            id: comment.id,
            blogPostId: comment.blog_post_id,
            userId: comment.user_id,
            authorName: comment.author_name,
            authorEmail: comment.author_email,
            content: comment.content,
            status: comment.status,
            isAnonymous: comment.is_anonymous,
            createdAt: comment.created_at,
          })))
        }

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

  const handleCommentSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!post) return

    const cleanContent = commentBody.trim()
    const cleanName = user && !isAnonymous
      ? (user.name || user.organization || "Account user")
      : commentName.trim()

    if (!cleanName || cleanName.length < 2) {
      toast.error("Please add your name")
      return
    }

    if (!cleanContent || cleanContent.length < 10) {
      toast.error("Please write a comment with at least 10 characters")
      return
    }

    setSubmittingComment(true)

    const { error } = await supabase.from("blog_comments").insert({
      blog_post_id: post.id,
      user_id: user && !isAnonymous ? user.id : null,
      author_name: cleanName.slice(0, 80),
      author_email: user && !isAnonymous ? user.email : commentEmail.trim() || null,
      content: cleanContent.slice(0, 1200),
      status: "pending",
      is_anonymous: !user || isAnonymous,
    })

    setSubmittingComment(false)

    if (error) {
      toast.error("Comment could not be submitted. Please try again.")
      return
    }

    toast.success("Comment submitted for admin approval")
    setCommentName("")
    setCommentEmail("")
    setCommentBody("")
  }

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

          <section className="mx-auto mt-14 max-w-3xl border-t border-border pt-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge className="mb-3 gap-2 bg-primary/10 text-primary hover:bg-primary/10">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Reader discussion
                </Badge>
                <h2 className="text-2xl font-bold text-foreground">Comments</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Approved comments appear publicly after admin review.
                </p>
              </div>
              <Badge variant="outline">{comments.length} approved</Badge>
            </div>

            <Card className="mb-6 border-border/70 bg-[linear-gradient(135deg,#ffffff_0%,#f5f9ff_100%)]">
              <CardContent className="p-5">
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#1877F2]/15 bg-[#1877F2]/5 p-3 text-xs leading-relaxed text-[#174EA6]">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  Your comment will be visible only after an admin approves it.
                </div>
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  {user && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAnonymous(false)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${!isAnonymous ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                      >
                        Comment as {user.name || user.email}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAnonymous(true)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${isAnonymous ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                      >
                        Comment as guest
                      </button>
                    </div>
                  )}

                  {(!user || isAnonymous) && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="comment-name">Name</Label>
                        <Input
                          id="comment-name"
                          value={commentName}
                          onChange={(event) => setCommentName(event.target.value)}
                          placeholder="Your name"
                          maxLength={80}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comment-email">Email optional</Label>
                        <Input
                          id="comment-email"
                          type="email"
                          value={commentEmail}
                          onChange={(event) => setCommentEmail(event.target.value)}
                          placeholder="Only for admin context"
                          maxLength={120}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="comment-body">Comment</Label>
                    <Textarea
                      id="comment-body"
                      value={commentBody}
                      onChange={(event) => setCommentBody(event.target.value)}
                      placeholder="Share a question, insight, or helpful experience..."
                      rows={5}
                      maxLength={1200}
                      required
                    />
                    <p className="text-right text-[11px] text-muted-foreground">{commentBody.length}/1200</p>
                  </div>

                  <Button type="submit" disabled={submittingComment} className="gap-2">
                    {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Submit for approval
                  </Button>
                </form>
              </CardContent>
            </Card>

            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {comment.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{comment.authorName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        {comment.isAnonymous && <Badge variant="secondary">Guest</Badge>}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{comment.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm font-semibold text-foreground">No approved comments yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Be the first to start the discussion.</p>
                </CardContent>
              </Card>
            )}
          </section>
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
