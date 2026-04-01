"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  Users,
  BookOpen,
  Briefcase,
  FileText,
  MessageSquare,
  ArrowRight,
  Clock,
  CheckCircle2,
  GraduationCap,
  Building2,
  Loader2,
} from "lucide-react"

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    students: 0,
    universities: 0,
    companies: 0,
    theses: 0,
    pendingTheses: 0,
    programs: 0,
    pendingPrograms: 0,
    blogs: 0,
    pendingBlogs: 0,
    testimonials: 0,
    approvedTestimonials: 0,
  })
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      
      const [
        { count: studentCount },
        { count: univCount },
        { count: companyCount },
        { count: thesesCount },
        { count: pendingThesesCount },
        { count: programsCount },
        { count: pendingProgramsCount },
        { count: blogsCount },
        { count: pendingBlogsCount },
        { count: testimonialsCount },
        { count: approvedTestimonialsCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('type', 'student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('type', 'university'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('type', 'company'),
        supabase.from('theses').select('*', { count: 'exact', head: true }),
        supabase.from('theses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('trainee_programs').select('*', { count: 'exact', head: true }),
        supabase.from('trainee_programs').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('testimonials').select('*', { count: 'exact', head: true }),
        supabase.from('testimonials').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      ])

      setStats({
        students: studentCount || 0,
        universities: univCount || 0,
        companies: companyCount || 0,
        theses: thesesCount || 0,
        pendingTheses: pendingThesesCount || 0,
        programs: programsCount || 0,
        pendingPrograms: pendingProgramsCount || 0,
        blogs: blogsCount || 0,
        pendingBlogs: pendingBlogsCount || 0,
        testimonials: testimonialsCount || 0,
        approvedTestimonials: approvedTestimonialsCount || 0,
      })
      
      setLoading(false)
    }

    fetchStats()
  }, [supabase])

  const totalPending = stats.pendingTheses + stats.pendingPrograms + stats.pendingBlogs

  // Determine where to send the user for review
  const reviewHref = stats.pendingTheses > 0 
    ? "/n_admin/dashboard/theses" 
    : stats.pendingPrograms > 0 
      ? "/n_admin/dashboard/trainee-programs" 
      : "/n_admin/dashboard/blogs"

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-lg font-bold text-foreground sm:text-xl">Admin Overview</h1>
        <p className="text-sm text-muted-foreground">
          Platform statistics and pending actions at a glance
        </p>
      </div>

      {/* Pending Alert */}
      {totalPending > 0 && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-amber-200/60 bg-amber-50/50 p-4 sm:flex-row sm:items-center dark:border-amber-900/30 dark:bg-amber-950/20">
          <Clock className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {totalPending} item{totalPending > 1 ? "s" : ""} waiting for approval
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.pendingTheses} thesis, {stats.pendingPrograms} programs, {stats.pendingBlogs} blogs
            </p>
          </div>
          <Link href={reviewHref}>
            <Button size="sm" variant="outline" className="gap-1 text-xs">
              Review <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        <Link href="/n_admin/dashboard/users">
          <Card className="cursor-pointer transition-colors hover:bg-secondary/30">
            <CardContent className="flex flex-col items-center p-4 text-center">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <span className="text-2xl font-bold text-foreground">{stats.students + stats.universities + stats.companies}</span>
              <span className="text-xs text-muted-foreground">Total Users</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/n_admin/dashboard/theses">
          <Card className="cursor-pointer transition-colors hover:bg-secondary/30">
            <CardContent className="flex flex-col items-center p-4 text-center">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                <BookOpen className="h-4 w-4 text-accent" />
              </div>
              <span className="text-2xl font-bold text-foreground">{stats.theses}</span>
              <span className="text-xs text-muted-foreground">Thesis</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/n_admin/dashboard/trainee-programs">
          <Card className="cursor-pointer transition-colors hover:bg-secondary/30">
            <CardContent className="flex flex-col items-center p-4 text-center">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Briefcase className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-foreground">{stats.programs}</span>
              <span className="text-xs text-muted-foreground">Programs</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/n_admin/dashboard/blogs">
          <Card className="cursor-pointer transition-colors hover:bg-secondary/30">
            <CardContent className="flex flex-col items-center p-4 text-center">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                <FileText className="h-4 w-4 text-violet-600" />
              </div>
              <span className="text-2xl font-bold text-foreground">{stats.blogs}</span>
              <span className="text-xs text-muted-foreground">Blog Posts</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/n_admin/dashboard/testimonials">
          <Card className="cursor-pointer transition-colors hover:bg-secondary/30">
            <CardContent className="flex flex-col items-center p-4 text-center">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <MessageSquare className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-foreground">{stats.testimonials}</span>
              <span className="text-xs text-muted-foreground">Testimonials</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two-column breakdown */}
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Users Breakdown */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Users Breakdown</h2>
            <Link href="/n_admin/dashboard/users">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Students</p>
                  <p className="text-xs text-muted-foreground">{stats.students} registered</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <Building2 className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Universities</p>
                  <p className="text-xs text-muted-foreground">{stats.universities} registered</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Briefcase className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Companies</p>
                  <p className="text-xs text-muted-foreground">{stats.companies} registered</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Content Status */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Content Status</h2>
          <div className="flex flex-col gap-2.5">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Approved Content</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.theses - stats.pendingTheses} thesis · {stats.programs - stats.pendingPrograms} programs · {stats.blogs - stats.pendingBlogs} blogs · {stats.approvedTestimonials} testimonials
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className={totalPending > 0 ? "border-amber-200/50 bg-amber-50/20" : ""}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Pending Approval</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingTheses} thesis · {stats.pendingPrograms} programs · {stats.pendingBlogs} blogs
                  </p>
                </div>
                {totalPending > 0 && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    {totalPending}
                  </span>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
