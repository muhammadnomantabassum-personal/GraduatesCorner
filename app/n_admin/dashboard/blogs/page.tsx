"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BlogCoverImage } from "@/components/shared/blog-cover-image"
import type { BlogPost } from "@/lib/data/types"
import {
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  PenLine,
  Loader2,
  Calendar,
  User,
  Image as ImageIcon,
} from "lucide-react"
import { toast } from "sonner"

export default function AdminBlogsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"approved" | "pending">("pending")

  const fetchPosts = async () => {
    setLoading(true)
    const response = await fetch("/api/admin/blog-posts")
    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      toast.error("Failed to fetch blog posts")
    } else {
      setPosts((result.posts || []).map((p: any) => ({
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
    setLoading(false)
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const approved = posts.filter((p) => p.status === "approved")
  const pending = posts.filter((p) => p.status === "pending")

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm("Are you sure you want to delete this post?")) return
    
    const response = await fetch(`/api/admin/blog-posts/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      toast.error("Failed to delete blog post")
    } else {
      toast.success("Blog post deleted")
      fetchPosts()
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Blog Management</h1>
          <p className="text-sm text-muted-foreground">
            Review and moderate blog submissions from the community
          </p>
        </div>
        <Link href="/n_admin/dashboard/blogs/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Write Official Blog
          </Button>
        </Link>
      </div>

      {/* Tab Switcher */}
      <div className="mb-6 flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex shrink-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium transition-all ${activeTab === "pending"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Clock className="h-4 w-4" />
          Pending Review
          {pending.length > 0 && (
            <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`flex shrink-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium transition-all ${activeTab === "approved"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Published
          <span className="ml-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {approved.length}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground text-sm">Loading blog posts...</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(activeTab === "pending" ? pending : approved).length > 0 ? (
            (activeTab === "pending" ? pending : approved).map((post) => (
              <Link key={post.id} href={`/n_admin/dashboard/blogs/${post.id}`}>
                <Card className="group h-full flex flex-col overflow-hidden transition-all hover:shadow-md cursor-pointer">
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {post.coverImage ? (
                      <BlogCoverImage
                        src={post.coverImage}
                        alt={post.title}
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-10 w-10 opacity-20" />
                      </div>
                    )}
                    <div className="absolute left-2 top-2">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-[10px]">
                        {post.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 flex flex-col flex-1">
                    <div className="mb-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.author}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <h3 className="line-clamp-2 min-h-[40px] text-sm font-bold text-foreground leading-snug mb-3">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 flex-1 gap-1.5 text-xs"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          router.push(`/n_admin/dashboard/blogs/${post.id}/edit`)
                        }}
                      >
                        <PenLine className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {activeTab === "approved" ? "Read Article" : "Review Details"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDelete(post.id, e)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-muted/30 rounded-xl border-2 border-dashed border-border">
              {activeTab === "pending" ? (
                <>
                  <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-500/30" />
                  <h3 className="text-lg font-semibold text-foreground">All caught up!</h3>
                  <p className="text-sm text-muted-foreground mt-1">No blog posts waiting for approval</p>
                </>
              ) : (
                <>
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground/30" />
                  <h3 className="text-lg font-semibold text-foreground">No blogs published</h3>
                  <p className="text-sm text-muted-foreground mt-1">Wait for community submissions or write one yourself</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
