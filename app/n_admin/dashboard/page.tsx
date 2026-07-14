"use client"

import { useEffect, useMemo, useState, type ElementType } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrafficAnalyticsPanel } from "@/components/admin/traffic-analytics-panel"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

type ProfileRow = { type: string | null; created_at: string | null }
type ThesisRow = { type: string | null; status: string | null; compensation: string | null; created_at: string | null }
type ProgramRow = { status: string | null; compensation: string | null; created_at: string | null }
type BlogRow = { status: string | null; category: string | null; created_at: string | null }
type TestimonialRow = { status: string | null; rating: number | null; created_at: string | null }

const COLORS = {
  blue: "#4285f4",
  green: "#34a853",
  yellow: "#fbbc05",
  red: "#ea4335",
  purple: "#8b5cf6",
  slate: "#64748b",
}

const emptyData = {
  profiles: [] as ProfileRow[],
  theses: [] as ThesisRow[],
  programs: [] as ProgramRow[],
  blogs: [] as BlogRow[],
  testimonials: [] as TestimonialRow[],
}

export default function AdminOverviewPage() {
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      const response = await fetch("/api/admin/analytics")
      const result = await response.json().catch(() => ({}))

      setData({
        profiles: (result.profiles || []) as ProfileRow[],
        theses: (result.theses || []) as ThesisRow[],
        programs: (result.programs || []) as ProgramRow[],
        blogs: (result.blogs || []) as BlogRow[],
        testimonials: (result.testimonials || []) as TestimonialRow[],
      })

      setLoading(false)
    }

    fetchDashboardData()
  }, [])

  const analytics = useMemo(() => buildAnalytics(data), [data])

  if (loading) {
    return (
      <div className="flex min-h-[520px] flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card text-primary shadow-sm">
        <Loader2 className="h-9 w-9 animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Building admin intelligence...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#16a34a_100%)] p-6 text-white shadow-[0_24px_90px_rgba(66,133,244,0.22)] lg:p-8">
        <div className="absolute right-[-6rem] top-[-6rem] h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[30%] h-72 w-72 rounded-full bg-[#fbbc05]/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Executive command center
            </div>
            <h1 className="max-w-4xl text-balance text-3xl font-bold tracking-tight lg:text-5xl">
              Graduates Corner Management Intelligence
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/76 lg:text-base">
              Monitor users, opportunity supply, approval velocity, content quality, and growth signals from one professional operations dashboard.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={analytics.reviewHref}>
                <Button className="gap-2 rounded-xl bg-white text-primary hover:bg-white/90">
                  Review pending work
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/n_admin/dashboard/users">
                <Button variant="outline" className="gap-2 rounded-xl border-white/25 bg-white/8 text-white hover:bg-white/14 hover:text-white">
                  Manage users
                  <Users className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white/80">Platform health</span>
              <Radio className="h-4 w-4 text-[#34a853]" />
            </div>
            <p className="mt-3 text-4xl font-bold">{analytics.healthScore}%</p>
            <p className="mt-1 text-xs text-white/68">Operational readiness score</p>
            <div className="mt-5 grid gap-3">
              {analytics.healthSignals.map((signal) => (
                <div key={signal.label}>
                  <div className="mb-1 flex justify-between text-xs text-white/72">
                    <span>{signal.label}</span>
                    <span>{signal.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/15">
                    <div className="h-2 rounded-full bg-white" style={{ width: `${signal.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total users"
          value={analytics.totalUsers}
          change={`${analytics.studentShare}% students`}
          icon={Users}
          color={COLORS.blue}
          href="/n_admin/dashboard/users"
        />
        <MetricCard
          title="Opportunity supply"
          value={analytics.totalOpportunities}
          change={`${analytics.approvedContent} approved`}
          icon={Sparkles}
          color={COLORS.green}
          href="/n_admin/dashboard/theses"
        />
        <MetricCard
          title="Pending review"
          value={analytics.totalPending}
          change={analytics.totalPending > 0 ? "Action required" : "Queue clear"}
          icon={Clock}
          color={analytics.totalPending > 0 ? COLORS.yellow : COLORS.green}
          href={analytics.reviewHref}
        />
        <MetricCard
          title="Content assets"
          value={analytics.contentAssets}
          change={`${analytics.approvedTestimonials} approved testimonials`}
          icon={FileText}
          color={COLORS.purple}
          href="/n_admin/dashboard/blogs"
        />
      </section>

      <TrafficAnalyticsPanel />

      {analytics.totalPending > 0 && (
        <section className="rounded-2xl border border-[#fbbc05]/40 bg-[#fbbc05]/10 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fbbc05]/20 text-[#996800]">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{analytics.totalPending} items need admin approval</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {analytics.pendingTheses} thesis, {analytics.pendingPrograms} programs, {analytics.pendingBlogs} blogs are waiting in the moderation queue.
                </p>
              </div>
            </div>
            <Link href={analytics.reviewHref}>
              <Button className="gap-2 rounded-xl">
                Open review queue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <ChartCard title="Platform growth" subtitle="Six-month user and content acquisition trend" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={310}>
            <AreaChart data={analytics.growthTrend}>
              <defs>
                <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.34} />
                  <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="contentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.30} />
                  <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
              <Area type="monotone" dataKey="users" stroke={COLORS.blue} fill="url(#usersGradient)" strokeWidth={3} />
              <Area type="monotone" dataKey="content" stroke={COLORS.green} fill="url(#contentGradient)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="User composition" subtitle="Registered account mix by role" icon={Users}>
          <ResponsiveContainer width="100%" height={310}>
            <PieChart>
              <Pie data={analytics.userMix} dataKey="value" nameKey="name" innerRadius={68} outerRadius={104} paddingAngle={4}>
                {analytics.userMix.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid gap-2 sm:grid-cols-3">
            {analytics.userMix.map((item) => (
              <div key={item.name} className="rounded-xl bg-secondary/70 p-3">
                <div className="mb-1 h-2 w-8 rounded-full" style={{ backgroundColor: item.color }} />
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.name}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ChartCard title="Approval pipeline" subtitle="Approved, pending, and rejected workload by content type" icon={ShieldCheck}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.pipelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
              <Bar dataKey="approved" stackId="a" fill={COLORS.green} radius={[0, 0, 4, 4]} />
              <Bar dataKey="pending" stackId="a" fill={COLORS.yellow} />
              <Bar dataKey="rejected" stackId="a" fill={COLORS.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="grid gap-4 md:grid-cols-2">
          <OperationsCard
            title="Moderation workload"
            icon={Clock}
            items={[
              { label: "Pending thesis", value: analytics.pendingTheses, href: "/n_admin/dashboard/theses" },
              { label: "Pending programs", value: analytics.pendingPrograms, href: "/n_admin/dashboard/trainee-programs" },
              { label: "Pending blogs", value: analytics.pendingBlogs, href: "/n_admin/dashboard/blogs" },
            ]}
          />
          <OperationsCard
            title="Publishing inventory"
            icon={BarChart3}
            items={[
              { label: "Master thesis", value: analytics.masterTheses, href: "/n_admin/dashboard/theses" },
              { label: "PhD positions", value: analytics.phdPositions, href: "/n_admin/dashboard/phd-positions" },
              { label: "Trainee programs", value: analytics.programs, href: "/n_admin/dashboard/trainee-programs" },
            ]}
          />
          <OperationsCard
            title="Trust signals"
            icon={CheckCircle2}
            items={[
              { label: "Approved content", value: analytics.approvedContent, href: "/n_admin/dashboard/theses" },
              { label: "Testimonials", value: analytics.testimonials, href: "/n_admin/dashboard/testimonials" },
              { label: "Avg. rating", value: analytics.averageRating, href: "/n_admin/dashboard/testimonials" },
            ]}
          />
          <OperationsCard
            title="Quick creation"
            icon={Zap}
            items={[
              { label: "Post thesis", value: "+", href: "/n_admin/dashboard/theses/new" },
              { label: "Post program", value: "+", href: "/n_admin/dashboard/trainee-programs/new" },
              { label: "Write blog", value: "+", href: "/n_admin/dashboard/blogs/new" },
            ]}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <ChartCard title="Opportunity model" subtitle="Compensation distribution across thesis and trainee supply" icon={Briefcase}>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={analytics.compensationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
              <Bar dataKey="value" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="overflow-hidden border-border bg-card shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-border bg-secondary/45 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Management action board</h2>
                  <p className="text-sm text-muted-foreground">High-leverage operational shortcuts</p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 p-5">
              {analytics.actionBoard.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-background p-4 transition-all hover:border-primary/30 hover:bg-secondary/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.color}18`, color: item.color }}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function buildAnalytics(data: typeof emptyData) {
  const profiles = data.profiles
  const theses = data.theses
  const programs = data.programs
  const blogs = data.blogs
  const testimonials = data.testimonials

  const students = countBy(profiles, "type", "student")
  const universities = countBy(profiles, "type", "university")
  const companies = countBy(profiles, "type", "company")
  const totalUsers = students + universities + companies

  const masterTheses = theses.filter((item) => item.type === "master").length
  const phdPositions = theses.filter((item) => item.type === "phd").length
  const pendingTheses = countBy(theses, "status", "pending")
  const pendingPrograms = countBy(programs, "status", "pending")
  const pendingBlogs = countBy(blogs, "status", "pending")
  const totalPending = pendingTheses + pendingPrograms + pendingBlogs
  const approvedTheses = countBy(theses, "status", "approved")
  const approvedPrograms = countBy(programs, "status", "approved")
  const approvedBlogs = countBy(blogs, "status", "approved")
  const approvedTestimonials = countBy(testimonials, "status", "approved")
  const approvedContent = approvedTheses + approvedPrograms + approvedBlogs
  const totalOpportunities = theses.length + programs.length
  const contentAssets = blogs.length + testimonials.length
  const testimonialRatings = testimonials.map((item) => item.rating || 0).filter(Boolean)
  const averageRating = testimonialRatings.length
    ? Number((testimonialRatings.reduce((sum, rating) => sum + rating, 0) / testimonialRatings.length).toFixed(1))
    : 0

  const reviewHref = pendingTheses > 0
    ? "/n_admin/dashboard/theses"
    : pendingPrograms > 0
      ? "/n_admin/dashboard/trainee-programs"
      : "/n_admin/dashboard/blogs"

  const approvalRate = percent(approvedContent, Math.max(1, theses.length + programs.length + blogs.length))
  const queueHealth = Math.max(35, 100 - totalPending * 8)
  const supplyHealth = Math.min(100, 40 + totalOpportunities * 4)
  const healthScore = Math.round((approvalRate + queueHealth + supplyHealth) / 3)

  return {
    students,
    universities,
    companies,
    totalUsers,
    studentShare: percent(students, Math.max(1, totalUsers)),
    masterTheses,
    phdPositions,
    programs: programs.length,
    pendingTheses,
    pendingPrograms,
    pendingBlogs,
    totalPending,
    approvedContent,
    approvedTestimonials,
    totalOpportunities,
    contentAssets,
    testimonials: testimonials.length,
    averageRating,
    reviewHref,
    healthScore,
    healthSignals: [
      { label: "Approval rate", value: approvalRate },
      { label: "Queue health", value: queueHealth },
      { label: "Supply depth", value: supplyHealth },
    ],
    userMix: [
      { name: "Students", value: students, color: COLORS.blue },
      { name: "Universities", value: universities, color: COLORS.green },
      { name: "Companies", value: companies, color: COLORS.yellow },
    ],
    growthTrend: buildGrowthTrend(profiles, theses, programs, blogs),
    pipelineData: [
      statusBucket("Thesis", theses),
      statusBucket("Programs", programs),
      statusBucket("Blogs", blogs),
      statusBucket("Reviews", testimonials),
    ],
    compensationData: buildCompensationData(theses, programs),
    actionBoard: [
      {
        label: "Review opportunity submissions",
        description: "Approve, reject, and maintain platform quality",
        href: reviewHref,
        icon: ShieldCheck,
        color: COLORS.yellow,
      },
      {
        label: "Create premium listings",
        description: "Publish admin-owned thesis and trainee opportunities",
        href: "/n_admin/dashboard/theses/new",
        icon: Sparkles,
        color: COLORS.blue,
      },
      {
        label: "Manage user ecosystem",
        description: "Inspect students, universities, companies, and admins",
        href: "/n_admin/dashboard/users",
        icon: Users,
        color: COLORS.green,
      },
      {
        label: "Grow content intelligence",
        description: "Publish blog insights and manage testimonials",
        href: "/n_admin/dashboard/blogs",
        icon: MessageSquare,
        color: COLORS.purple,
      },
    ],
  }
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  href,
}: {
  title: string
  value: number
  change: string
  icon: ElementType
  color: string
  href: string
}) {
  return (
    <Link href={href}>
      <Card className="group h-full border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_50px_rgba(66,133,244,0.12)]">
        <CardContent className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}18`, color }}>
              <Icon className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
          </div>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          <p className="mt-1 text-sm font-medium text-foreground">{title}</p>
          <p className="mt-2 text-xs text-muted-foreground">{change}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string
  subtitle: string
  icon: ElementType
  children: React.ReactNode
}) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function OperationsCard({
  title,
  icon: Icon,
  items,
}: {
  title: string
  icon: ElementType
  items: Array<{ label: string; value: number | string; href: string }>
}) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <div className="grid gap-2">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between rounded-xl bg-secondary/55 px-3 py-2.5 text-sm transition-colors hover:bg-secondary"
            >
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-bold text-foreground">{item.value}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function countBy<T extends Record<string, unknown>>(items: T[], key: keyof T, value: string) {
  return items.filter((item) => item[key] === value).length
}

function percent(value: number, total: number) {
  return Math.round((value / total) * 100)
}

function statusBucket(name: string, items: Array<{ status: string | null }>) {
  return {
    name,
    approved: items.filter((item) => item.status === "approved").length,
    pending: items.filter((item) => item.status === "pending").length,
    rejected: items.filter((item) => item.status === "rejected").length,
  }
}

function buildCompensationData(theses: ThesisRow[], programs: ProgramRow[]) {
  const rows = [...theses, ...programs]
  return ["paid", "stipend", "unpaid"].map((name) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: rows.filter((row) => row.compensation === name).length,
  }))
}

function buildGrowthTrend(profiles: ProfileRow[], theses: ThesisRow[], programs: ProgramRow[], blogs: BlogRow[]) {
  const now = new Date()
  const months = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: date.toLocaleDateString("en-US", { month: "short" }),
      users: 0,
      content: 0,
    }
  })

  profiles.forEach((item) => addToMonth(months, item.created_at, "users"))
  ;[...theses, ...programs, ...blogs].forEach((item) => addToMonth(months, item.created_at, "content"))

  return months
}

function addToMonth(
  months: Array<{ key: string; month: string; users: number; content: number }>,
  value: string | null,
  field: "users" | "content"
) {
  if (!value) return
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return
  const key = `${date.getFullYear()}-${date.getMonth()}`
  const month = months.find((item) => item.key === key)
  if (month) month[field] += 1
}
