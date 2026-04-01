"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { BlogPost } from "@/lib/data/types"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Calendar,
  User,
} from "lucide-react"
import { toast } from "sonner"

export default function AdminBlogDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [isActioning, setIsActioning] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        toast.error("Failed to fetch blog post")
        router.push("/n_admin/dashboard/blogs")
      } else if (data) {
        setPost({
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
        })
      }
      setLoading(false)
    }

    fetchPost()
  }, [id, supabase, router])

  const handleApprove = async () => {
    if (!post) return
    setIsActioning(true)
    const { error } = await supabase
      .from('blog_posts')
      .update({ status: 'approved' })
      .eq('id', post.id)

    if (error) {
      toast.error("Failed to approve blog post")
    } else {
      toast.success("Blog post approved and published!")
      router.push("/n_admin/dashboard/blogs")
    }
    setIsActioning(false)
  }

  const handleReject = async () => {
    if (!post) return
    setIsActioning(true)
    const { error } = await supabase
      .from('blog_posts')
      .update({ status: 'rejected' })
      .eq('id', post.id)

    if (error) {
      toast.error("Failed to reject blog post")
    } else {
      toast.success("Blog post rejected")
      router.push("/n_admin/dashboard/blogs")
    }
    setIsActioning(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading blog details...</p>
      </div>
    )
  }

  if (!post) return null

  const isHtml = post.content.trim().startsWith('<')

  return (
    <div className="mx-auto max-w-4xl px-4">
      <div className="mb-6">
        <Link
          href="/n_admin/dashboard/blogs"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to All Blogs
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{post.category}</Badge>
            <Badge 
              variant={post.status === 'approved' ? 'default' : 'secondary'}
              className={post.status === 'approved' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}
            >
              {post.status === 'approved' ? 'Published' : post.status === 'pending' ? 'Pending Review' : 'Rejected'}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{post.title}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {post.status !== 'approved' && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleApprove}
              disabled={isActioning}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </Button>
          )}
          {post.status !== 'rejected' && (
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10 border-destructive/20"
              onClick={handleReject}
              disabled={isActioning}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            {post.coverImage && (
              <div className="relative aspect-video w-full border-b bg-muted">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-foreground">{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg italic text-muted-foreground mb-8 border-l-4 border-primary">
                {post.excerpt}
              </div>

              <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
                {isHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                ) : (
                  <div className="whitespace-pre-wrap">{post.content}</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4">Post Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Author</p>
                  <p className="text-sm font-medium mt-1">{post.author}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Category</p>
                  <p className="text-sm font-medium mt-1">{post.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Submission Date</p>
                  <p className="text-sm font-medium mt-1">
                    {new Date(post.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
