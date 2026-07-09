"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Info, Loader2, Save, Send } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth-context"
import type { ApprovalStatus } from "@/lib/data/types"
import { htmlToPlainText } from "@/lib/text"
import { toNullableUuid } from "@/lib/uuid"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CoverImageSelector } from "@/components/shared/cover-image-selector"
import { RichTextEditor } from "@/components/shared/rich-text-editor"

export const studentBlogCategories = [
  "Academic Life",
  "Career Tips",
  "Industry Insights",
  "Student Stories",
  "Success Stories",
  "Research",
  "Study Abroad",
]

export const universityBlogCategories = [
  "Academic Life",
  "Career Tips",
  "Industry Insights",
  "Research",
  "University News",
  "Student Stories",
  "Success Stories",
]

export const companyBlogCategories = [
  "Academic Life",
  "Career Tips",
  "Industry Insights",
  "Research",
  "Company News",
  "Student Stories",
  "Success Stories",
]

export const adminBlogCategories = [
  "Academic Life",
  "Career Tips",
  "Industry Insights",
  "Research",
  "Company News",
  "University News",
  "Student Stories",
  "Success Stories",
  "Platform Updates",
]

type BlogFormMode = "create" | "edit"
type BlogOwnerType = "student" | "university" | "company" | "admin"

type BlogPostFormProps = {
  mode: BlogFormMode
  ownerType: BlogOwnerType
  blogId?: string
  backHref: string
  successHref: string
  pageTitle: string
  pageDescription: string
  categories: string[]
}

type BlogRow = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  category: string
  cover_image: string | null
  read_time: string | null
  status: ApprovalStatus
  posted_by_user_id: string | null
}

function buildSlug(title: string, suffix: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 78)

  return `${base || "blog-post"}-${suffix}`
}

function getCreateSlug(title: string) {
  return buildSlug(title, Date.now().toString(36))
}

function getEditSlug(title: string, id: string) {
  return buildSlug(title, id.slice(0, 8))
}

function getAuthorName(ownerType: BlogOwnerType, user: { name: string; organization?: string } | null) {
  if (ownerType === "admin") return "Graduates Corner Team"
  if (!user) return ""
  return ownerType === "student" ? user.name : user.organization || user.name
}

export function BlogPostForm({
  mode,
  ownerType,
  blogId,
  backHref,
  successHref,
  pageTitle,
  pageDescription,
  categories,
}: BlogPostFormProps) {
  const router = useRouter()
  const { user, loading: authLoading, supabase } = useAuth()
  const isAdmin = ownerType === "admin"

  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [originalTitle, setOriginalTitle] = useState("")
  const [originalSlug, setOriginalSlug] = useState("")
  const [currentStatus, setCurrentStatus] = useState<ApprovalStatus>("pending")
  const [loadingPost, setLoadingPost] = useState(mode === "edit")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (mode !== "edit" || !blogId || authLoading) return

    if (!user) {
      setLoadingPost(false)
      return
    }

    let isMounted = true

    const fetchPost = async () => {
      setLoadingPost(true)
      let post: BlogRow | null = null
      let loadError = ""

      if (isAdmin) {
        const response = await fetch(`/api/admin/blog-posts/${blogId}`)
        const result = await response.json().catch(() => ({}))

        if (!response.ok) {
          loadError = result.error || "Failed to load blog post"
        } else {
          post = result.post as BlogRow
        }
      } else {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("id", blogId)
          .single()

        if (error) loadError = error.message
        else post = data as BlogRow
      }

      if (!isMounted) return

      if (loadError || !post) {
        toast.error("Failed to load blog post")
        router.push(backHref)
        return
      }

      if (!isAdmin && post.posted_by_user_id !== user.id) {
        toast.error("You can only edit your own blog posts")
        router.push(backHref)
        return
      }

      setTitle(post.title || "")
      setExcerpt(post.excerpt || "")
      setContent(post.content || "")
      setCategory(post.category || "")
      setCoverImage(post.cover_image || "")
      setOriginalTitle(post.title || "")
      setOriginalSlug(post.slug || "")
      setCurrentStatus(post.status || "pending")
      setLoadingPost(false)
    }

    fetchPost()

    return () => {
      isMounted = false
    }
  }, [authLoading, backHref, blogId, isAdmin, mode, router, supabase, user])

  const plainContent = htmlToPlainText(content)
  const wordCount = plainContent.split(/\s+/).filter(Boolean).length
  const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`

  const infoCopy = useMemo(() => {
    if (isAdmin) {
      return mode === "create"
        ? "Admin blog posts are published immediately to the public blog."
        : "Admin edits are saved directly and remain visible according to the current post status."
    }

    return mode === "create"
      ? "Your blog post will be reviewed by the admin team before publishing."
      : "After editing, your blog post will return to pending review before it appears publicly again."
  }, [isAdmin, mode])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!user) {
      toast.error("You must be logged in to save a blog post")
      return
    }

    if (!title.trim() || !excerpt.trim() || !plainContent || !category) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    const author = getAuthorName(ownerType, user)
    const nextSlug =
      mode === "edit" && title.trim() === originalTitle.trim()
        ? originalSlug
        : mode === "edit" && blogId
          ? getEditSlug(title, blogId)
          : getCreateSlug(title)

    if (mode === "create") {
      const createPayload = {
        title: title.trim(),
        slug: nextSlug,
        excerpt: excerpt.trim(),
        content,
        author,
        category,
        cover_image: coverImage || null,
        read_time: readTime,
        posted_by_user_id: isAdmin ? toNullableUuid(user.id) : user.id,
        status: isAdmin ? "approved" : "pending",
      }

      const error = isAdmin
        ? await fetch("/api/admin/blog-posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createPayload),
          })
            .then(async (response) => {
              if (response.ok) return null
              const result = await response.json().catch(() => ({}))
              return { message: result.error || "Failed to publish blog post" }
            })
            .catch((requestError) => ({ message: requestError.message || "Failed to publish blog post" }))
        : (await supabase.from("blog_posts").insert(createPayload)).error

      setIsSubmitting(false)

      if (error) {
        toast.error(`Failed to ${isAdmin ? "publish" : "submit"} blog post: ${error.message}`)
        return
      }

      toast.success(isAdmin ? "Blog post published successfully" : "Blog post submitted for review")
      router.push(successHref)
      return
    }

    if (!blogId) {
      setIsSubmitting(false)
      toast.error("Missing blog post id")
      return
    }

    const updatePayload = {
      title: title.trim(),
      slug: nextSlug,
      excerpt: excerpt.trim(),
      content,
      author,
      category,
      cover_image: coverImage || null,
      read_time: readTime,
      status: isAdmin ? currentStatus : "pending",
    }

    const error = isAdmin
      ? await fetch(`/api/admin/blog-posts/${blogId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        })
          .then(async (response) => {
            if (response.ok) return null
            const result = await response.json().catch(() => ({}))
            return { message: result.error || "Failed to update blog post" }
          })
          .catch((requestError) => ({ message: requestError.message || "Failed to update blog post" }))
      : (await supabase
          .from("blog_posts")
          .update(updatePayload)
          .eq("id", blogId)
          .eq("posted_by_user_id", user.id)).error

    setIsSubmitting(false)

    if (error) {
      toast.error(`Failed to update blog post: ${error.message}`)
      return
    }

    toast.success(isAdmin ? "Blog post updated" : "Blog post updated and sent for review")
    router.push(successHref)
  }

  if (authLoading || loadingPost) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading blog editor...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Blog Posts
        </Link>
        <h1 className="text-xl font-bold text-foreground">{pageTitle}</h1>
        <p className="text-sm text-muted-foreground">{pageDescription}</p>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">
            {isAdmin ? "Admin publishing controls" : "Review workflow"}
          </p>
          <p className="mt-1">{infoCopy}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="flex flex-col gap-5 p-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter a descriptive title for your blog post"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={150}
              />
              <span className="text-right text-[10px] text-muted-foreground">
                {title.length}/150
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <CoverImageSelector value={coverImage} onChange={setCoverImage} />

            <div className="flex flex-col gap-2">
              <Label htmlFor="excerpt" className="text-sm font-medium">
                Excerpt <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="excerpt"
                placeholder="Write a brief summary that will appear on the blog card"
                rows={3}
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                required
                maxLength={300}
              />
              <span className="text-right text-[10px] text-muted-foreground">
                {excerpt.length}/300
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                Content <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your blog post content here..."
                minHeight={360}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Rich text editor</span>
                <span>{readTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <Link href={backHref}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting} className="gap-1.5">
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : mode === "edit" ? (
              <>
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                {isAdmin ? "Publish Post" : "Submit for Review"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
