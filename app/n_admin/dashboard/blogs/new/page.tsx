"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Send, Info, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { CoverImageSelector, FALLBACK_COVER } from "@/components/shared/cover-image-selector"
import { Textarea } from "@/components/ui/textarea"

const categories = [
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

export default function AdminNewBlogPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("You must be logged in to post a blog")
      return
    }

    if (!title.trim() || !excerpt.trim() || !content.trim() || !category) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    const wordCount = content.trim().split(/\s+/).filter(Boolean).length
    const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`
    const slug = title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')

    const { error } = await supabase
      .from('blog_posts')
      .insert({
        title,
        slug,
        excerpt,
        content,
        author: "Graduates Corner Team", // Default for admin posts
        category,
        cover_image: coverImage || FALLBACK_COVER,
        read_time: readTime,
        posted_by_user_id: user.id,
        status: 'approved' // Admin posts are approved immediately
      })

    setIsSubmitting(false)

    if (error) {
      toast.error("Failed to publish blog post: " + error.message)
    } else {
      toast.success("Blog post published successfully!")
      router.push("/n_admin/dashboard/blogs")
    }
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const readTimeNum = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/n_admin/dashboard/blogs"
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Blog Posts
        </Link>
        <h1 className="text-xl font-bold text-foreground">Write a Blog Post</h1>
        <p className="text-sm text-muted-foreground">
          Publish content directly to the public blog
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200/50 bg-emerald-50/30 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <div className="text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-emerald-800">Admin posts are published immediately</p>
          <p className="mt-1">
            As an admin, your blog post will be automatically approved and published
            on the public blog page for all visitors to read.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="flex flex-col gap-5 p-6">
            {/* Title */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter a descriptive title for your blog post"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={150}
              />
              <span className="text-right text-[10px] text-muted-foreground">
                {title.length}/150
              </span>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cover Image */}
            <CoverImageSelector value={coverImage} onChange={setCoverImage} />

            {/* Excerpt */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="excerpt" className="text-sm font-medium">
                Excerpt <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="excerpt"
                placeholder="Write a brief summary that will appear on the blog card (2-3 sentences)"
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                required
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                maxLength={300}
              />
              <span className="text-right text-[10px] text-muted-foreground">
                {excerpt.length}/300
              </span>
            </div>

            {/* Content Textarea */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="content" className="text-sm font-medium">
                Content <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your blog post content here..."
                required
                className="min-h-[300px] resize-y"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Plain Text</span>
                <span>
                  ~{readTimeNum} min read
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <Link href="/n_admin/dashboard/blogs">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting} className="gap-1.5">
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Publish Post
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
