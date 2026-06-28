"use client"

import { useEffect, useMemo, useState, type ElementType } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ProfilePhotoSection } from "@/components/shared/profile-photo-section"
import type { BlogPost, Testimonial, Thesis } from "@/lib/data/types"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  MessageSquare,
  PenLine,
  Plus,
  ShieldCheck,
  Sparkles,
  Telescope,
  UsersRound,
} from "lucide-react"

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
    <Card className="h-full border-border/70 bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
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

export default function UniversityDashboard() {
  const { user, supabase } = useAuth()
  const [myTheses, setMyTheses] = useState<Thesis[]>([])
  const [myBlogs, setMyBlogs] = useState<BlogPost[]>([])
  const [myTestimonials, setMyTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      setLoading(true)

      const [thesisRes, blogRes, testRes] = await Promise.all([
        supabase
          .from("theses")
          .select("*")
          .or(`posted_by_user_id.eq.${user.id},organization.eq.${user.organization}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("blog_posts")
          .select("*")
          .eq("posted_by_user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("testimonials")
          .select("*")
          .eq("user_id", user.id),
      ])

      if (thesisRes.data) {
        setMyTheses(thesisRes.data.map((t: any) => ({
          id: t.id,
          title: t.title,
          type: t.type,
          description: t.description,
          subject: t.subject,
          organization: t.organization,
          organizationType: t.organization_type,
          location: t.location,
          compensation: t.compensation,
          deadline: t.deadline,
          postedBy: t.posted_by,
          postedByUserId: t.posted_by_user_id,
          externalUrl: t.external_url,
          status: t.status,
          createdAt: t.created_at,
        })))
      }

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

      setLoading(false)
    }

    fetchDashboardData()
  }, [user, supabase])

  const masterTheses = myTheses.filter((t) => t.type === "master")
  const phdPositions = myTheses.filter((t) => t.type === "phd")
  const approvedTheses = myTheses.filter((t) => t.status === "approved")
  const pendingTheses = myTheses.filter((t) => t.status === "pending")
  const approvedBlogs = myBlogs.filter((b) => b.status === "approved")
  const pendingBlogs = myBlogs.filter((b) => b.status === "pending")
  const approvedTestimonial = myTestimonials.find((t) => t.status === "approved")
  const totalPublished = approvedTheses.length + approvedBlogs.length
  const totalPending = pendingTheses.length + pendingBlogs.length
  const approvalRate = myTheses.length + myBlogs.length === 0
    ? 0
    : Math.round((totalPublished / (myTheses.length + myBlogs.length)) * 100)

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "Recently"

  const setupItems = useMemo(() => [
    { label: "University profile", done: Boolean(user?.organization), href: "/dashboard/university" },
    { label: "Institution bio", done: Boolean(user?.bio), href: "/dashboard/university" },
    { label: "Master thesis post", done: masterTheses.length > 0, href: "/dashboard/university/theses/new" },
    { label: "PhD position post", done: phdPositions.length > 0, href: "/dashboard/university/phd-positions/new" },
    { label: "Academic insight", done: myBlogs.length > 0, href: "/dashboard/university/blogs/new" },
  ], [masterTheses.length, myBlogs.length, phdPositions.length, user?.bio, user?.organization])

  const setupScore = Math.round((setupItems.filter((item) => item.done).length / setupItems.length) * 100)
  const recentItems = [...myTheses, ...myBlogs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

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
        <div className="grid lg:grid-cols-[1.45fr_0.95fr]">
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_42%,#ffffff_100%)] p-6 sm:p-8">
            <div className="absolute right-8 top-8 h-32 w-32 rounded-full bg-[#4285F4]/10 blur-2xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
              <ProfilePhotoSection size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-[#E8F0FE] text-[#1967D2] hover:bg-[#E8F0FE]">
                    <Telescope className="mr-1 h-3 w-3" />
                    Academic opportunity cockpit
                  </Badge>
                  <Badge variant="outline" className="bg-white/80">{setupScore}% account setup</Badge>
                </div>
                <h1 className="mt-4 truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {user?.organization || user?.name || "University"} workspace
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Coordinate master thesis openings, PhD positions, university content, and credibility signals from one refined management system.
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

          <div className="border-t border-border/70 p-6 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Publishing health</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{approvalRate}%</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#34A853]/10 text-[#188038]">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <Progress value={approvalRate} className="mt-4 h-2" />
            <div className="mt-5 space-y-2">
              {setupItems.map((item) => (
                <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-xs transition-colors hover:bg-secondary">
                  <span className="font-medium text-foreground">{item.label}</span>
                  {item.done ? <CheckCircle2 className="h-4 w-4 text-[#34A853]" /> : <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Master Theses" value={masterTheses.length} helper="Research topics for master students." icon={BookOpen} tone="bg-[#4285F4]/10 text-[#1967D2]" href="/dashboard/university/theses" />
        <StatCard label="PhD Positions" value={phdPositions.length} helper="Advanced academic opportunities." icon={GraduationCap} tone="bg-[#34A853]/10 text-[#188038]" href="/dashboard/university/phd-positions" />
        <StatCard label="Content" value={myBlogs.length} helper={`${approvedBlogs.length} published, ${pendingBlogs.length} in review.`} icon={FileText} tone="bg-[#FBBC04]/15 text-[#B06000]" href="/dashboard/university/blogs" />
        <StatCard label="Feedback" value={myTestimonials.length} helper={approvedTestimonial ? "Public testimonial is live." : "Add a trust signal."} icon={MessageSquare} tone="bg-[#A142F4]/10 text-[#8430CE]" href="/dashboard/university/testimonials" />
        <StatCard label="Pending" value={totalPending} helper="Items waiting for admin review." icon={Clock} tone="bg-[#EA4335]/10 text-[#D93025]" />
        <StatCard label="Live Reach" value={totalPublished} helper="Approved public-facing content." icon={UsersRound} tone="bg-[#00ACC1]/10 text-[#00838F]" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.2fr_0.9fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Academic Actions</h2>
            <Badge variant="outline" className="bg-white text-[10px]">Fast publish</Badge>
          </div>
          <ActionCard href="/dashboard/university/theses/new" title="Post master thesis" description="Share a new supervised research topic." icon={Plus} primary />
          <ActionCard href="/dashboard/university/phd-positions/new" title="Post PhD position" description="Promote advanced research openings." icon={GraduationCap} />
          <ActionCard href="/dashboard/university/blogs/new" title="Publish academic insight" description="Showcase departments, research, and student stories." icon={PenLine} />
          <ActionCard href="/dashboard/university/testimonials" title="Add feedback" description="Build trust with future students." icon={MessageSquare} />
        </div>

        <Card className="border-border/70 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Recent Academic Activity</h2>
                <p className="mt-1 text-xs text-muted-foreground">Latest thesis, PhD, and content updates.</p>
              </div>
              <Link href="/dashboard/university/theses">
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-primary">
                  Manage <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-14">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentItems.length > 0 ? (
                recentItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/25 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                      {"subject" in item ? item.type === "phd" ? <GraduationCap className="h-4 w-4" /> : <BookOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {"subject" in item ? item.subject : item.category}
                      </p>
                    </div>
                    <Badge className={`shrink-0 text-[10px] ${item.status === "approved" ? "bg-[#34A853]/10 text-[#188038] hover:bg-[#34A853]/10" : "bg-[#FBBC04]/15 text-[#B06000] hover:bg-[#FBBC04]/15"}`}>
                      {item.status === "approved" ? "Live" : "Review"}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/30" />
                  <p className="mt-3 text-sm font-medium text-foreground">No academic posts yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Create your first thesis or PhD opportunity.</p>
                  <Link href="/dashboard/university/theses/new" className="mt-4 inline-flex">
                    <Button size="sm" className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Post thesis
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
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Academic Mix</h2>
                  <p className="text-xs text-muted-foreground">Opportunity coverage by type.</p>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {[
                  { label: "Master", value: masterTheses.length, color: "bg-[#4285F4]" },
                  { label: "PhD", value: phdPositions.length, color: "bg-[#34A853]" },
                  { label: "Insights", value: myBlogs.length, color: "bg-[#FBBC04]" },
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
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Recommended Move</h2>
                  <p className="text-xs text-white/60">Best next step for student reach.</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/80">
                {masterTheses.length === 0
                  ? "Post a master thesis first so students can discover a clear entry point."
                  : phdPositions.length === 0
                    ? "Add a PhD position to expand your research pipeline."
                    : myBlogs.length === 0
                      ? "Publish an academic insight to make your university profile feel active."
                      : "Review pending items and keep your opportunity inventory fresh."}
              </p>
              <Link href={masterTheses.length === 0 ? "/dashboard/university/theses/new" : phdPositions.length === 0 ? "/dashboard/university/phd-positions/new" : myBlogs.length === 0 ? "/dashboard/university/blogs/new" : "/dashboard/university/theses"}>
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
