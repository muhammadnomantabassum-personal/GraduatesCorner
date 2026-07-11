"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import {
  PenLine,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Loader2,
  BookOpen,
  Calendar,
} from "lucide-react"
import type { BlogPost } from "@/lib/data/types"
import { toast } from "sonner"

type FilterTab = "all" | "approved" | "pending" | "rejected"

export default function CompanyBlogsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const [myBlogs, setMyBlogs] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchMyBlogs = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('posted_by_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error("Failed to fetch your blog posts")
    } else {
      setMyBlogs(data.map((b: any) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        excerpt: b.excerpt,
        content: b.content,
        author: b.author,
        category: b.category,
        coverImage: b.cover_image,
        createdAt: b.created_at,
        readTime: b.read_time,
        status: b.status,
        postedByUserId: b.posted_by_user_id,
      })))
    }
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchMyBlogs()
  }, [fetchMyBlogs])

  const filtered = useMemo(() =>
    activeTab === "all" ? myBlogs : myBlogs.filter((b) => b.status === activeTab),
    [myBlogs, activeTab]
  )

  const counts = {
    all: myBlogs.length,
    approved: myBlogs.filter((b) => b.status === "approved").length,
    pending: myBlogs.filter((b) => b.status === "pending").length,
    rejected: myBlogs.filter((b) => b.status === "rejected").length,
  }

  const tabs: { key: FilterTab; label: string; icon: typeof FileText }[] = [
    { key: "all", label: "All", icon: FileText },
    { key: "approved", label: "Published", icon: CheckCircle2 },
    { key: "pending", label: "Pending", icon: Clock },
    { key: "rejected", label: "Rejected", icon: XCircle },
  ]

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground sm:text-xl">My Blog Posts</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track your blog submissions
          </p>
        </div>
        <Link href="/dashboard/company/blogs/new">
          <Button className="gap-1.5">
            <PenLine className="h-4 w-4" />
            Write Post
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/30 p-1 scrollbar-none">
        {tabs
          .filter((t) => t.key !== "rejected" || counts.rejected > 0)
          .map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all ${activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${activeTab === tab.key
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
      </div>

      {/* Blog List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground text-sm">Loading your blog posts...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map((post) => (
            <Card
              key={post.id}
              className={`transition-all duration-200 hover:shadow-md border-l-[3px] ${post.status === "approved"
                ? "border-l-emerald-500"
                : post.status === "pending"
                  ? "border-l-amber-500"
                  : "border-l-destructive"
              }`}
            >
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={`text-[10px] font-medium ${post.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
                          : post.status === "pending"
                            ? "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10"
                            : "bg-destructive/10 text-destructive hover:bg-destructive/10"
                        }`}
                      >
                        {post.status === "approved" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {post.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                        {post.status === "rejected" && <XCircle className="mr-1 h-3 w-3" />}
                        {post.status === "approved"
                          ? "Published"
                          : post.status === "pending"
                            ? "Pending Review"
                            : "Rejected"}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground leading-snug">
                      {post.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {post.excerpt}
                    </p>
                    <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-primary/70" />
                          {post.category}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary/70" />
                          {post.readTime}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary/70" />
                          {new Date(post.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link href={`/dashboard/company/blogs/${post.id}/edit`}>
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                        <PenLine className="h-3 w-3" />
                        Edit
                      </Button>
                    </Link>
                    {post.status === "approved" && (
                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center sm:py-16">
            <FileText className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-1 text-base font-semibold text-foreground">
              {activeTab === "all" ? "No blog posts yet" : `No ${activeTab} posts`}
            </h3>
            <p className="mb-5 text-sm text-muted-foreground">
              {activeTab === "all"
                ? "Start writing to share your company's insights"
                : `You don't have any ${activeTab} blog posts`}
            </p>
            {activeTab === "all" && (
              <Link href="/dashboard/company/blogs/new">
                <Button className="gap-1.5">
                  <PenLine className="h-4 w-4" />
                  Write Your First Post
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
