"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProfilePhotoSection } from "@/components/shared/profile-photo-section"
import type { BlogPost, Testimonial } from "@/lib/data/types"
import {
  BookOpen,
  Briefcase,
  PenLine,
  MessageSquare,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2,
  Mail,
  CalendarDays,
  Loader2,
  Heart,
  Send,
  Badge
} from "lucide-react"

export default function StudentDashboard() {
  const { user, supabase } = useAuth()
  const [myBlogs, setMyBlogs] = useState<BlogPost[]>([])
  const [myTestimonials, setMyTestimonials] = useState<Testimonial[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const [appliedCount, setAppliedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || user.type === 'admin') return

      setLoading(true)

      // Fetch blogs, testimonials, wishlist count, and applied count in parallel
      const [blogRes, testRes, wishlistRes, appliedRes] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('*')
          .eq('posted_by_user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('testimonials')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('wishlist')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ])

      if (blogRes.data) {
        setMyBlogs(blogRes.data.map((b: any) => ({
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

      if (testRes.data) {
        setMyTestimonials(testRes.data.map((t: any) => ({
          id: t.id,
          author: t.author,
          role: t.role,
          organization: t.organization,
          content: t.content,
          rating: t.rating,
          status: t.status,
          createdAt: t.created_at,
          userId: t.user_id,
        })))
      }

      if (wishlistRes.count !== null) {
        setWishlistCount(wishlistRes.count)
      }

      if (appliedRes.count !== null) {
        setAppliedCount(appliedRes.count)
      }

      setLoading(false)
    }

    fetchDashboardData()
  }, [user, supabase])

  const approvedBlogs = myBlogs.filter((b) => b.status === "approved")
  const pendingBlogs = myBlogs.filter((b) => b.status === "pending")
  const approvedTestimonial = myTestimonials.find((t) => t.status === "approved")

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "Recently"

  if (loading && !user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Profile Section */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <ProfilePhotoSection size="md" />
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">{user?.name || "Student"}</h1>
              {user?.bio && (
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{user.bio}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user?.email}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Member since {memberSince}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card>
          <CardContent className="flex flex-col items-center p-4 text-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground">{myBlogs.length}</span>
            <span className="text-xs text-muted-foreground">Total Blogs</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4 text-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-foreground">{approvedBlogs.length}</span>
            <span className="text-xs text-muted-foreground">Published</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4 text-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-2xl font-bold text-foreground">{pendingBlogs.length}</span>
            <span className="text-xs text-muted-foreground">Pending</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4 text-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <MessageSquare className="h-4 w-4 text-accent" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              {myTestimonials.length}
            </span>
            <span className="text-xs text-muted-foreground">Feedback</span>
          </CardContent>
        </Card>
        <Link href="/dashboard/student/wishlist">
          <Card className="h-full transition-colors hover:bg-red-50/50">
            <CardContent className="flex flex-col items-center p-4 text-center">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
                <Heart className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-2xl font-bold text-foreground">
                {wishlistCount}
              </span>
              <span className="text-xs text-muted-foreground">Wishlist</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/student/applied">
          <Card className="h-full transition-colors hover:bg-primary/5">
            <CardContent className="flex flex-col items-center p-4 text-center">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Send className="h-4 w-4 text-primary" />
              </div>
              <span className="text-2xl font-bold text-foreground">
                {appliedCount}
              </span>
              <span className="text-xs text-muted-foreground">Applied</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
        {/* Quick Actions */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
          <Link href="/dashboard/student/blogs/new">
            <Card className="cursor-pointer border-dashed transition-colors hover:border-primary/40 hover:bg-primary/[0.02]">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <PenLine className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Write a Blog Post</p>
                  <p className="text-xs text-muted-foreground">Share your experience</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/master-thesis">
            <Card className="cursor-pointer transition-colors hover:bg-secondary/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Browse Theses</p>
                  <p className="text-xs text-muted-foreground">Master & PhD positions</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/trainee-programs">
            <Card className="cursor-pointer transition-colors hover:bg-secondary/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <Briefcase className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Trainee Programs</p>
                  <p className="text-xs text-muted-foreground">Graduate opportunities</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/student/testimonials">
            <Card className="cursor-pointer transition-colors hover:bg-secondary/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <MessageSquare className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">My Feedback</p>
                  <p className="text-xs text-muted-foreground">
                    {approvedTestimonial ? "View your feedback" : "Share your experience"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Blog Activity */}
        <div className="flex flex-col gap-3 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Blog Posts</h2>
            <Link href="/dashboard/student/blogs">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : myBlogs.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {myBlogs.slice(0, 4).map((post) => (
                <Card key={post.id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{post.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{post.category}</span>
                        <span className="text-border">·</span>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <Badge
                      variant={post.status === "approved" ? "default" : "secondary"}
                      className={`shrink-0 text-[10px] ${post.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
                          : "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10"
                        }`}
                    >
                      {post.status === "approved" ? "Published" : "Pending"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">No blog posts yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start sharing your experiences and insights
                </p>
                <Link href="/dashboard/student/blogs/new" className="mt-4">
                  <Button size="sm" className="gap-1.5">
                    <PenLine className="h-3.5 w-3.5" />
                    Write Your First Post
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
