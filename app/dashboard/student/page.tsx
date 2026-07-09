"use client"

import { useEffect, useMemo, useState, type ElementType } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ProfilePhotoSection } from "@/components/shared/profile-photo-section"
import type { BlogPost, Testimonial } from "@/lib/data/types"
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Heart,
  Loader2,
  Mail,
  MessageSquare,
  PenLine,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
} from "lucide-react"
import { getDaysUntil } from "@/lib/opportunity-filters"

type DeadlineAlert = {
  id: string
  title: string
  href: string
  type: "PhD" | "Thesis" | "Trainee"
  deadline: string
  days: number
}

type StatCardProps = {
  label: string
  value: number | string
  helper: string
  icon: ElementType
  tone: string
  href?: string
}

function StatCard({ label, value, helper, icon: Icon, tone, href }: StatCardProps) {
  const content = (
    <Card className="h-full overflow-hidden border-border/70 bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

type ActionCardProps = {
  href: string
  title: string
  description: string
  icon: ElementType
  primary?: boolean
}

function ActionCard({ href, title, description, icon: Icon, primary }: ActionCardProps) {
  return (
    <Link href={href}>
      <Card className={`cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${primary ? "border-primary/30 bg-primary/[0.03]" : "bg-white/90"}`}>
        <CardContent className="flex items-center gap-3 p-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${primary ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  )
}

export default function StudentDashboard() {
  const { user, supabase } = useAuth()
  const [myBlogs, setMyBlogs] = useState<BlogPost[]>([])
  const [myTestimonials, setMyTestimonials] = useState<Testimonial[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const [appliedCount, setAppliedCount] = useState(0)
  const [deadlineAlerts, setDeadlineAlerts] = useState<DeadlineAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || user.type === "admin") return

      setLoading(true)

      const [blogRes, testRes, wishlistRes, appliedRes, wishlistDeadlineRes] = await Promise.all([
        supabase
          .from("blog_posts")
          .select("*")
          .eq("posted_by_user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("testimonials")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("wishlist")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("wishlist")
          .select("theses (id, title, type, deadline), trainee_programs (id, title, deadline)")
          .eq("user_id", user.id),
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

      setWishlistCount(wishlistRes.count ?? 0)
      setAppliedCount(appliedRes.count ?? 0)
      if (wishlistDeadlineRes.data) {
        const alerts = wishlistDeadlineRes.data
          .reduce<DeadlineAlert[]>((items, item: any) => {
            const thesis = Array.isArray(item.theses) ? item.theses[0] : item.theses
            const program = Array.isArray(item.trainee_programs) ? item.trainee_programs[0] : item.trainee_programs

            if (thesis) {
              const days = getDaysUntil(thesis.deadline)
              items.push({
                id: thesis.id,
                title: thesis.title,
                href: thesis.type === "phd" ? `/phd-positions/${thesis.id}` : `/theses/${thesis.id}`,
                type: thesis.type === "phd" ? "PhD" : "Thesis",
                deadline: thesis.deadline,
                days,
              })
            }

            if (program) {
              const days = getDaysUntil(program.deadline)
              items.push({
                id: program.id,
                title: program.title,
                href: `/trainee-programs/${program.id}`,
                type: "Trainee",
                deadline: program.deadline,
                days,
              })
            }
            return items
          }, [])
          .filter((item) => item.days >= 0 && item.days <= 14)
          .sort((a, b) => a.days - b.days)
          .slice(0, 4)
        setDeadlineAlerts(alerts)
      }
      setLoading(false)
    }

    fetchDashboardData()
  }, [user, supabase])

  const approvedBlogs = myBlogs.filter((b) => b.status === "approved")
  const pendingBlogs = myBlogs.filter((b) => b.status === "pending")
  const approvedTestimonial = myTestimonials.find((t) => t.status === "approved")
  const pendingTestimonial = myTestimonials.find((t) => t.status === "pending")

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "Recently"

  const readinessItems = useMemo(() => [
    { label: "Profile photo", done: Boolean(user?.avatar), href: "/dashboard/student" },
    { label: "Bio added", done: Boolean(user?.bio), href: "/dashboard/student" },
    { label: "Saved opportunities", done: wishlistCount > 0, href: "/dashboard/student/wishlist" },
    { label: "Tracked applications", done: appliedCount > 0, href: "/dashboard/student/applied" },
    { label: "Shared feedback", done: myTestimonials.length > 0, href: "/dashboard/student/testimonials" },
  ], [appliedCount, myTestimonials.length, user?.avatar, user?.bio, wishlistCount])

  const readinessScore = Math.round((readinessItems.filter((item) => item.done).length / readinessItems.length) * 100)
  const applicationMomentum = wishlistCount + appliedCount + approvedBlogs.length

  if (loading && !user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_45%,#ffffff_100%)] p-6 sm:p-8">
            <div className="absolute right-6 top-6 hidden h-28 w-28 rounded-full bg-[#4285F4]/10 blur-2xl sm:block" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
              <ProfilePhotoSection size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-[#E8F0FE] text-[#1967D2] hover:bg-[#E8F0FE]">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Student command center
                  </Badge>
                  <Badge variant="outline" className="bg-white/80">
                    {readinessScore}% profile ready
                  </Badge>
                </div>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Welcome back, {user?.name || "Student"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Manage your profile, saved opportunities, applications, feedback, and career content from one focused workspace.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex min-w-0 items-center gap-1">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-[#4285F4]" />
                    <span className="truncate">{user?.email}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-[#34A853]" />
                    Member since {memberSince}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/70 bg-white p-6 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Account readiness</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{readinessScore}%</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#34A853]/10 text-[#188038]">
                <UserRoundCheck className="h-5 w-5" />
              </div>
            </div>
            <Progress value={readinessScore} className="mt-4 h-2" />
            <div className="mt-4 grid gap-2">
              {readinessItems.map((item) => (
                <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-xs transition-colors hover:bg-secondary">
                  <span className="font-medium text-foreground">{item.label}</span>
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 text-[#34A853]" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Wishlist" value={wishlistCount} helper="Saved thesis, PhD, and trainee opportunities." icon={Heart} tone="bg-[#EA4335]/10 text-[#D93025]" href="/dashboard/student/wishlist" />
        <StatCard label="Applications" value={appliedCount} helper="External applications tracked in your account." icon={Send} tone="bg-[#4285F4]/10 text-[#1967D2]" href="/dashboard/student/applied" />
        <StatCard label="Blogs" value={myBlogs.length} helper={`${approvedBlogs.length} published, ${pendingBlogs.length} waiting.`} icon={FileText} tone="bg-[#FBBC04]/15 text-[#B06000]" href="/dashboard/student/blogs" />
        <StatCard label="Feedback" value={myTestimonials.length} helper={approvedTestimonial ? "Public testimonial is live." : pendingTestimonial ? "Feedback is under review." : "Add your platform experience."} icon={MessageSquare} tone="bg-[#34A853]/10 text-[#188038]" href="/dashboard/student/testimonials" />
        <StatCard label="Readiness" value={`${readinessScore}%`} helper="Profile strength for better discovery." icon={ShieldCheck} tone="bg-[#A142F4]/10 text-[#8430CE]" />
        <StatCard label="Momentum" value={applicationMomentum} helper="Saved, applied, and published activity." icon={TrendingUp} tone="bg-[#00ACC1]/10 text-[#00838F]" />
      </section>

      {deadlineAlerts.length > 0 && (
        <section className="rounded-2xl border border-[#FBBC04]/30 bg-[#FFF8E1] p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[#8A5A00]">
                <Clock className="h-4 w-4" />
                Deadline reminders
              </h2>
              <p className="mt-1 text-xs text-[#8A5A00]/80">Saved opportunities that need attention soon.</p>
            </div>
            <Link href="/dashboard/student/calendar">
              <Button size="sm" variant="outline" className="border-[#FBBC04]/40 bg-white/70 text-[#8A5A00] hover:bg-white">
                Open calendar
              </Button>
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {deadlineAlerts.map((item) => (
              <Link key={`${item.type}-${item.id}`} href={item.href} className="rounded-xl border border-[#FBBC04]/30 bg-white p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                  <span className="rounded-md bg-[#EA4335]/10 px-2 py-0.5 text-[10px] font-bold text-[#B3261E]">
                    {item.days === 0 ? "Due today" : `Deadline in ${item.days} days`}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs font-semibold leading-relaxed text-foreground">{item.title}</p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {new Date(item.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.2fr_0.9fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Smart Actions</h2>
            <Badge variant="outline" className="bg-white text-[10px]">Fast access</Badge>
          </div>
          <ActionCard href="/master-thesis" title="Find thesis matches" description="Explore master and PhD research openings." icon={BookOpen} primary />
          <ActionCard href="/trainee-programs" title="Browse trainee programs" description="Track graduate programs in your wishlist." icon={Briefcase} />
          <ActionCard href="/dashboard/student/blogs/new" title="Write career insight" description="Publish your academic or job-search story." icon={PenLine} />
          <ActionCard href="/dashboard/student/testimonials" title="Share feedback" description="Help future students trust the platform." icon={MessageSquare} />
        </div>

        <Card className="border-border/70 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Recent Content Activity</h2>
                <p className="mt-1 text-xs text-muted-foreground">Your latest writing and review status.</p>
              </div>
              <Link href="/dashboard/student/blogs">
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-primary">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-14">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : myBlogs.length > 0 ? (
                myBlogs.slice(0, 5).map((post) => (
                  <div key={post.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/25 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{post.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{post.category}</span>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <Badge className={`shrink-0 text-[10px] ${post.status === "approved" ? "bg-[#34A853]/10 text-[#188038] hover:bg-[#34A853]/10" : "bg-[#FBBC04]/15 text-[#B06000] hover:bg-[#FBBC04]/15"}`}>
                      {post.status === "approved" ? "Published" : "Pending"}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground/30" />
                  <p className="mt-3 text-sm font-medium text-foreground">No blog posts yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Start building your public academic profile.</p>
                  <Link href="/dashboard/student/blogs/new" className="mt-4 inline-flex">
                    <Button size="sm" className="gap-1.5">
                      <PenLine className="h-3.5 w-3.5" />
                      Write first post
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/70 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4285F4]/10 text-[#1967D2]">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Opportunity Pipeline</h2>
                  <p className="text-xs text-muted-foreground">From discovery to action.</p>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {[
                  { label: "Saved", value: wishlistCount, color: "bg-[#EA4335]" },
                  { label: "Applied", value: appliedCount, color: "bg-[#4285F4]" },
                  { label: "Published", value: approvedBlogs.length, color: "bg-[#34A853]" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{item.label}</span>
                      <span className="text-muted-foreground">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(100, item.value * 20)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-[#202124] text-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Next Best Move</h2>
                  <p className="text-xs text-white/60">Recommended for your account.</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/80">
                {wishlistCount === 0
                  ? "Save a few roles first so you can compare deadlines, fields, and locations."
                  : appliedCount === 0
                    ? "Open your wishlist and apply to the strongest fit while the deadline is still fresh."
                    : user?.bio
                      ? "Keep your activity warm by publishing a short blog about your search or study interests."
                      : "Add a short bio so your profile feels complete when your content is reviewed."}
              </p>
              <Link href={wishlistCount === 0 ? "/master-thesis" : appliedCount === 0 ? "/dashboard/student/wishlist" : user?.bio ? "/dashboard/student/blogs/new" : "/dashboard/student"}>
                <Button className="mt-5 w-full gap-2 bg-white text-[#202124] hover:bg-white/90">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
