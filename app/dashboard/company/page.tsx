"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProfilePhotoSection } from "@/components/shared/profile-photo-section"
import { createClient } from "@/lib/supabase/client"
import type { TraineeProgram, Thesis, BlogPost, Testimonial } from "@/lib/data/types"
import {
  Briefcase,
  BookOpen,
  PenLine,
  MessageSquare,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2,
  Mail,
  CalendarDays,
  Plus,
  Loader2,
} from "lucide-react"

export default function CompanyDashboard() {
  const { user } = useAuth()
  const [myPrograms, setMyPrograms] = useState<TraineeProgram[]>([])
  const [myTheses, setMyTheses] = useState<Thesis[]>([])
  const [myBlogs, setMyBlogs] = useState<BlogPost[]>([])
  const [myTestimonials, setMyTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      setLoading(true)

      // Fetch programs
      const { data: progData } = await supabase
        .from('trainee_programs')
        .select('*')
        .or(`posted_by_user_id.eq.${user.id},company.eq.${user.organization}`)
        .order('created_at', { ascending: false })

      if (progData) {
        setMyPrograms(progData.map((p: any) => ({
          id: p.id,
          title: p.title,
          company: p.company,
          description: p.description,
          field: p.field,
          location: p.location,
          duration: p.duration,
          compensation: p.compensation,
          deadline: p.deadline,
          postedBy: p.posted_by,
          postedByUserId: p.posted_by_user_id,
          externalUrl: p.external_url,
          status: p.status,
          createdAt: p.created_at,
        })))
      }

      // Fetch theses
      const { data: thesisData } = await supabase
        .from('theses')
        .select('*')
        .or(`posted_by_user_id.eq.${user.id},organization.eq.${user.organization}`)
        .order('created_at', { ascending: false })

      if (thesisData) {
        setMyTheses(thesisData.map((t: any) => ({
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

      // Fetch blogs
      const { data: blogData } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('posted_by_user_id', user.id)
        .order('created_at', { ascending: false })

      if (blogData) {
        setMyBlogs(blogData.map((b: any) => ({
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

      // Fetch testimonials
      const { data: testData } = await supabase
        .from('testimonials')
        .select('*')
        .eq('user_id', user.id)

      if (testData) {
        setMyTestimonials(testData.map((t: any) => ({
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

  const pendingPrograms = myPrograms.filter((p) => p.status === "pending")
  const totalPending =
    pendingPrograms.length +
    myTheses.filter((t) => t.status === "pending").length +
    myBlogs.filter((b) => b.status === "pending").length

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
              <h1 className="text-lg font-bold text-foreground">
                {user?.organization || user?.name || "Company"}
              </h1>
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
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col items-center p-4 text-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground">{myPrograms.length}</span>
            <span className="text-xs text-muted-foreground">Trainee Programs</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4 text-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <BookOpen className="h-4 w-4 text-accent" />
            </div>
            <span className="text-2xl font-bold text-foreground">{myTheses.length}</span>
            <span className="text-xs text-muted-foreground">Theses</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4 text-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <FileText className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-foreground">{myBlogs.length}</span>
            <span className="text-xs text-muted-foreground">Blog Posts</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4 text-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-2xl font-bold text-foreground">{totalPending}</span>
            <span className="text-xs text-muted-foreground">Pending Review</span>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions + Recent Programs */}
      <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
        {/* Quick Actions */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
          <Link href="/dashboard/company/trainee-programs/new">
            <Card className="cursor-pointer border-dashed transition-colors hover:border-primary/40 hover:bg-primary/[0.02]">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Post a Trainee Program</p>
                  <p className="text-xs text-muted-foreground">Graduate trainee position</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/company/theses/new">
            <Card className="cursor-pointer border-dashed transition-colors hover:border-primary/40 hover:bg-primary/[0.02]">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Post a Thesis</p>
                  <p className="text-xs text-muted-foreground">Master or PhD position</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/company/blogs/new">
            <Card className="cursor-pointer border-dashed transition-colors hover:border-primary/40 hover:bg-primary/[0.02]">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <PenLine className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Write a Blog Post</p>
                  <p className="text-xs text-muted-foreground">Share industry insights</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/company/testimonials">
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

        {/* Recent Trainee Programs */}
        <div className="flex flex-col gap-3 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Trainee Programs</h2>
            <Link href="/dashboard/company/trainee-programs">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : myPrograms.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {myPrograms.slice(0, 4).map((program) => (
                <Card key={program.id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{program.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{program.field}</span>
                        <span className="text-border">·</span>
                        <span>{program.duration}</span>
                      </div>
                    </div>
                    <Badge
                      variant={program.status === "approved" ? "default" : "secondary"}
                      className={`shrink-0 text-[10px] ${program.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
                          : "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10"
                        }`}
                    >
                      {program.status === "approved" ? "Approved" : "Pending"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">No programs posted yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start by posting your first trainee program
                </p>
                <Link href="/dashboard/company/trainee-programs/new" className="mt-4">
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Post Program
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
