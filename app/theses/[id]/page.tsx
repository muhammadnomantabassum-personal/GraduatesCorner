"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PublicLayout } from "@/components/layout/public-layout"
import { ThesisCard } from "@/components/shared/thesis-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import type { Thesis } from "@/lib/data/types"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { sanitizeHtml } from "@/lib/sanitize-html"
import { isHtmlContent } from "@/lib/text"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building2,
  GraduationCap,
  ExternalLink,
  Clock,
  BookOpen,
  Loader2,
} from "lucide-react"

export default function ThesisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const pathname = usePathname()
  const { user } = useAuth()
  const [thesis, setThesis] = useState<Thesis | null>(null)
  const [relatedTheses, setRelatedTheses] = useState<Thesis[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const expectedPhdRoute = pathname.startsWith("/phd-positions")

  useEffect(() => {
    const fetchThesis = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('theses')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        console.error('Unable to load the opportunity.')
      } else if (data) {
        let profile: { is_verified?: boolean; verification_badge?: Thesis["verificationBadge"] } | null = null

        if (data.posted_by_user_id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("is_verified, verification_badge")
            .eq("id", data.posted_by_user_id)
            .maybeSingle()

          profile = profileData
        }

        const formattedThesis: Thesis = {
          id: data.id,
          title: data.title,
          type: data.type,
          description: data.description,
          subject: data.subject,
          organization: data.organization,
          organizationType: data.organization_type,
          location: data.location,
          compensation: data.compensation,
          deadline: data.deadline,
          postedBy: data.posted_by,
          postedByUserId: data.posted_by_user_id,
          externalUrl: data.external_url,
          status: data.status,
          createdAt: data.created_at,
          organizationVerified: data.posted_by === "admin" || Boolean(profile?.is_verified),
          verificationBadge: profile?.verification_badge || "verified",
        }
        setThesis(formattedThesis)

        // Fetch related theses — show if at least 1 field is in common
        const currentFields = data.subject
          ? data.subject.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
          : []

        const { data: relatedData } = await supabase
          .from('theses')
          .select('*')
          .eq('status', 'approved')
          .eq('type', data.type)
          .neq('id', data.id)
          .limit(30) // fetch broader pool, filter client-side

        if (relatedData) {
          const filtered = relatedData
            .filter((t: any) => {
              if (!t.subject) return false
              const tFields = t.subject
                .split(',')
                .map((s: string) => s.trim().toLowerCase())
                .filter(Boolean)
              return tFields.some((f: string) => currentFields.includes(f))
            })
            .slice(0, 3)

          setRelatedTheses(filtered.map((t: any) => ({
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
            organizationVerified: t.posted_by === "admin",
            verificationBadge: "verified",
          })))
        }
      }
      setLoading(false)
    }

    fetchThesis()
  }, [id, supabase])

  const handleApply = async () => {
    if (user?.type === "student") {
      await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          thesis_id: id,
        })
    }
  }

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">
            Loading {expectedPhdRoute ? "PhD position" : "opportunity"} details...
          </p>
        </div>
      </PublicLayout>
    )
  }

  if (!thesis) {
    const notFoundTitle = expectedPhdRoute ? "PhD Position Not Found" : "Opportunity Not Found"
    const notFoundCopy = expectedPhdRoute
      ? "The PhD position you are looking for does not exist or is not published yet."
      : "The opportunity you are looking for does not exist or is not published yet."
    const notFoundBackLink = expectedPhdRoute ? "/phd-positions" : "/master-thesis"

    return (
      <PublicLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
          <h1 className="mb-4 text-2xl font-bold text-foreground">{notFoundTitle}</h1>
          <p className="mb-6 text-center text-muted-foreground">{notFoundCopy}</p>
          <Link href={notFoundBackLink}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Browse
            </Button>
          </Link>
        </div>
      </PublicLayout>
    )
  }

  const backLink = thesis.type === "phd" ? "/phd-positions" : "/master-thesis"
  const backText = thesis.type === "phd" ? "Back to PhD Positions" : "Back to Master's Theses"
  const opportunityLabel = thesis.type === "phd" ? "PhD Position" : "Master's Thesis"
  const descriptionHasHtml = isHtmlContent(thesis.description)

  return (
    <PublicLayout>
      <section className="border-b border-border bg-primary px-4 py-10 text-primary-foreground lg:py-14">
        <div className="mx-auto max-w-7xl">
          <Link
            href={backLink}
            className="mb-4 inline-flex items-center gap-2 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {backText}
          </Link>
          <h1 className="mb-4 flex flex-wrap items-center gap-3 text-balance text-3xl font-bold lg:text-4xl">
            {thesis.title}
            <Badge className="bg-primary-foreground/20 text-primary-foreground px-2.5 py-1 text-sm font-semibold ring-1 ring-primary-foreground/40">
              {opportunityLabel}
            </Badge>
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-primary-foreground/80">
            <span className="flex items-center gap-1.5">
              {thesis.organizationType === "university" ? (
                <GraduationCap className="h-4 w-4" />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
              {thesis.organization}
              {(thesis.organizationVerified || thesis.postedBy === "admin") && (
                <VerifiedBadge badge={thesis.verificationBadge} className="bg-white text-[#1877F2]" />
              )}
              {thesis.postedBy === "admin" && (
                <span className="text-primary-foreground/40">- by Graduates Corner</span>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {thesis.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Deadline:{" "}
              {new Date(thesis.deadline).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 lg:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="flex-1">
              <Card>
                <CardContent className="p-6 lg:p-8">
                  <h2 className="mb-4 text-xl font-semibold text-foreground">Description</h2>
                  {descriptionHasHtml ? (
                    <div
                      className="prose prose-sm max-w-none text-muted-foreground [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_h2]:text-foreground [&_h3]:text-foreground [&_ol]:list-decimal [&_ul]:list-disc [&_li]:ml-5"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(thesis.description) }}
                    />
                  ) : (
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      {thesis.description.split("\n").map((paragraph, i) => (
                        <p key={i} className="mb-4 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}

                  <Separator className="my-6" />

                  <h2 className="mb-4 text-xl font-semibold text-foreground">Details</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Subject Area</p>
                        <p className="text-sm text-muted-foreground">{thesis.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {thesis.type === "phd" ? "Position Type" : "Thesis Type"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {thesis.type === "phd" ? "PhD / Doctoral Position" : "Master's Thesis"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Location</p>
                        <p className="text-sm text-muted-foreground">{thesis.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Posted</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(thesis.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <aside className="w-full shrink-0 lg:w-80">
              <div className="flex flex-col gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="mb-4 font-semibold text-foreground">Apply Now</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Applications for this position are handled by{" "}
                      <span className="font-medium text-foreground">{thesis.organization}</span>.
                    </p>
                    {thesis.externalUrl && (
                      <a
                        href={thesis.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleApply}
                      >
                        <Button className="w-full gap-2">
                          Apply at {thesis.organizationType === "university" ? "University" : "Company"} Website
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="mb-3 font-semibold text-foreground">
                      About {thesis.organization}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {thesis.organizationType === "university" ? (
                        <GraduationCap className="h-4 w-4 text-primary" />
                      ) : (
                        <Building2 className="h-4 w-4 text-primary" />
                      )}
                      <span className="capitalize">{thesis.organizationType}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{thesis.location}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>

        </div>
      </section>

      {/* Related Theses */}
      {relatedTheses.length > 0 && (
        <section className="border-t border-border bg-slate-50/50 dark:bg-slate-900/20 px-4 py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {thesis.type === "phd" ? "Related PhD Positions" : "Related Theses"}
              </h2>
              <Link href={thesis.type === "phd" ? "/phd-positions" : "/master-thesis"} className="text-sm font-medium text-primary hover:underline">
                View all {"->"}
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedTheses.map((t) => (
                <ThesisCard key={t.id} thesis={t} />
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  )
}
