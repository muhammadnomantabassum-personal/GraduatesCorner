"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { BlogComment } from "@/lib/data/types"
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react"

type CommentTab = "pending" | "approved" | "rejected"

export default function AdminCommentsPage() {
  const { supabase } = useAuth()
  const [comments, setComments] = useState<BlogComment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<CommentTab>("pending")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const mapComments = (data: any[]) => data.map((comment: any) => ({
    id: comment.id,
    blogPostId: comment.blog_post_id,
    userId: comment.user_id,
    authorName: comment.author_name,
    authorEmail: comment.author_email,
    content: comment.content,
    status: comment.status,
    isAnonymous: comment.is_anonymous,
    createdAt: comment.created_at,
    postTitle: comment.blog_posts?.title,
    postSlug: comment.blog_posts?.slug,
  }))

  const fetchComments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("blog_comments")
      .select(`
        *,
        blog_posts:blog_post_id (
          title,
          slug
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Failed to fetch blog comments")
    } else {
      setComments(mapComments(data || []))
    }
    setLoading(false)
  }

  useEffect(() => {
    let active = true

    const loadComments = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("blog_comments")
        .select(`
          *,
          blog_posts:blog_post_id (
            title,
            slug
          )
        `)
        .order("created_at", { ascending: false })

      if (!active) return

      if (error) {
        toast.error("Failed to fetch blog comments")
      } else {
        setComments(mapComments(data || []))
      }
      setLoading(false)
    }

    loadComments()
    return () => {
      active = false
    }
  }, [supabase])

  const counts = useMemo(() => ({
    pending: comments.filter((comment) => comment.status === "pending").length,
    approved: comments.filter((comment) => comment.status === "approved").length,
    rejected: comments.filter((comment) => comment.status === "rejected").length,
  }), [comments])

  const filtered = comments.filter((comment) => comment.status === activeTab)

  const handleStatus = async (id: string, status: CommentTab) => {
    setUpdatingId(id)
    const { error } = await supabase
      .from("blog_comments")
      .update({ status })
      .eq("id", id)

    setUpdatingId(null)

    if (error) {
      toast.error("Failed to update comment")
    } else {
      toast.success(status === "approved" ? "Comment approved" : "Comment rejected")
      fetchComments()
    }
  }

  const handleDelete = async (id: string) => {
    setUpdatingId(id)
    const { error } = await supabase
      .from("blog_comments")
      .delete()
      .eq("id", id)

    setUpdatingId(null)

    if (error) {
      toast.error("Failed to delete comment")
    } else {
      toast.success("Comment deleted")
      fetchComments()
    }
  }

  const tabs: { key: CommentTab; label: string; icon: typeof Clock }[] = [
    { key: "pending", label: "Pending", icon: Clock },
    { key: "approved", label: "Approved", icon: CheckCircle2 },
    { key: "rejected", label: "Rejected", icon: XCircle },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge className="mb-3 gap-2 bg-primary/10 text-primary hover:bg-primary/10">
            <ShieldCheck className="h-3.5 w-3.5" />
            Moderated discussion
          </Badge>
          <h1 className="text-xl font-bold text-foreground">Blog Comments</h1>
          <p className="text-sm text-muted-foreground">
            Review reader comments before they appear publicly on articles.
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          {counts.pending} waiting for review
        </Badge>
      </div>

      <div className="mb-5 flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-all ${
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading comments...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((comment) => (
            <Card key={comment.id} className={`border-l-[3px] ${
              comment.status === "approved"
                ? "border-l-emerald-500"
                : comment.status === "rejected"
                  ? "border-l-destructive"
                  : "border-l-amber-500"
            }`}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant={comment.status === "approved" ? "default" : "secondary"}>
                          {comment.status}
                        </Badge>
                        <Badge variant="outline" className="gap-1.5">
                          <UserRound className="h-3 w-3" />
                          {comment.isAnonymous ? "Guest" : "Account"}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{comment.authorName}</p>
                      {comment.authorEmail && (
                        <p className="text-xs text-muted-foreground">{comment.authorEmail}</p>
                      )}
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {comment.content}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(comment.createdAt).toLocaleString("en-GB")}</span>
                        {comment.postTitle && <span>Article: {comment.postTitle}</span>}
                      </div>
                    </div>
                    {comment.postSlug && (
                      <Link href={`/blog/${comment.postSlug}`}>
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                          View article
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
                    {comment.status !== "approved" && (
                      <Button
                        size="sm"
                        disabled={updatingId === comment.id}
                        onClick={() => handleStatus(comment.id, "approved")}
                        className="h-8 gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                    )}
                    {comment.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === comment.id}
                        onClick={() => handleStatus(comment.id, "rejected")}
                        className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={updatingId === comment.id}
                      onClick={() => handleDelete(comment.id)}
                      className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                    >
                      {updatingId === comment.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <h3 className="text-base font-semibold text-foreground">No {activeTab} comments</h3>
            <p className="mt-1 text-sm text-muted-foreground">Comments will appear here when readers submit them.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
