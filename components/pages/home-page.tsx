"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { DiscoveryHero } from "@/components/shared/discovery-hero"
import { PublicLayout } from "@/components/layout/public-layout"
import { ThesisCard } from "@/components/shared/thesis-card"
import { ProgramCard } from "@/components/shared/program-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleSelectionModal } from "@/components/shared/role-selection-modal"
import { OpportunityGridSkeleton } from "@/components/shared/opportunity-grid-skeleton"
import { useAuth } from "@/lib/auth-context"
import type { Thesis, TraineeProgram } from "@/lib/data/types"
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CalendarClock,
  FileText,
  Flag,
  Globe2,
  GraduationCap,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
} from "lucide-react"

type OpportunityTrack = "phd" | "master" | "programs"

const quickFilters = [
  { href: "/master-thesis", label: "Master's thesis", icon: BookOpen },
  { href: "/phd-positions", label: "PhD positions", icon: GraduationCap },
  { href: "/trainee-programs", label: "Graduate programs", icon: Briefcase },
]

const opportunityTracks: Array<{
  id: OpportunityTrack
  label: string
  title: string
  copy: string
  href: string
  empty: string
}> = [
  {
    id: "phd",
    label: "PhD",
    title: "Latest PhD positions",
    copy: "Doctoral and research roles from universities and research institutions.",
    href: "/phd-positions",
    empty: "No PhD positions are available at the moment.",
  },
  {
    id: "master",
    label: "Master's thesis",
    title: "Latest master's thesis positions",
    copy: "Focused academic projects from universities and industry partners.",
    href: "/master-thesis",
    empty: "No master's thesis positions are available at the moment.",
  },
  {
    id: "programs",
    label: "Trainee programs",
    title: "Latest trainee programs",
    copy: "Structured early-career programs from companies building future talent.",
    href: "/trainee-programs",
    empty: "No trainee programs are available at the moment.",
  },
]

function mapThesis(thesis: any): Thesis {
  return {
    id: thesis.id,
    title: thesis.title,
    type: thesis.type,
    opportunityKind: thesis.opportunity_kind,
    description: thesis.description,
    subject: thesis.subject,
    organization: thesis.organization,
    organizationType: thesis.organization_type,
    location: thesis.location,
    compensation: thesis.compensation,
    deadline: thesis.deadline,
    postedBy: thesis.posted_by,
    postedByUserId: thesis.posted_by_user_id,
    externalUrl: thesis.external_url,
    status: thesis.status,
    createdAt: thesis.created_at,
    organizationVerified: thesis.posted_by === "admin" || Boolean(thesis.profiles?.is_verified),
    verificationBadge: thesis.profiles?.verification_badge || "verified",
  }
}

function mapProgram(program: any): TraineeProgram {
  return {
    id: program.id,
    title: program.title,
    company: program.company,
    description: program.description,
    field: program.field,
    location: program.location,
    duration: program.duration,
    compensation: program.compensation,
    deadline: program.deadline,
    postedBy: program.posted_by,
    postedByUserId: program.posted_by_user_id,
    externalUrl: program.external_url,
    status: program.status,
    createdAt: program.created_at,
    organizationVerified: program.posted_by === "admin" || Boolean(program.profiles?.is_verified),
    verificationBadge: program.profiles?.verification_badge || "verified",
  }
}

function HomePageContent() {
  const router = useRouter()
  const { supabase, user } = useAuth()

  const [showRoleModal, setShowRoleModal] = useState(false)
  const [theses, setTheses] = useState<Thesis[]>([])
  const [programs, setPrograms] = useState<TraineeProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTrack, setActiveTrack] = useState<OpportunityTrack>("phd")
  const [platformCounts, setPlatformCounts] = useState({ phd: 0, master: 0, programs: 0 })

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const signup = searchParams.get("signup")
    if (signup !== "success") return

    if (user) {
      router.push(user.type === "admin" ? "/n_admin/dashboard" : `/dashboard/${user.type}`)
    } else {
      setTimeout(() => setShowRoleModal(true), 0)
    }

    const newParams = new URLSearchParams(searchParams.toString())
    newParams.delete("signup")
    const queryString = newParams.toString()
    router.replace(queryString ? `/?${queryString}` : "/")
  }, [router, user])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [phdResult, masterResult, programResult, phdCount, masterCount, programCount] =
          await Promise.all([
            supabase
              .from("theses")
              .select("*, profiles:posted_by_user_id (is_verified, verification_badge)")
              .eq("status", "approved").gte("deadline", new Date().toISOString().slice(0, 10))
              .eq("type", "phd")
              .order("created_at", { ascending: false })
              .limit(3),
            supabase
              .from("theses")
              .select("*, profiles:posted_by_user_id (is_verified, verification_badge)")
              .eq("status", "approved").gte("deadline", new Date().toISOString().slice(0, 10))
              .eq("type", "master")
              .order("created_at", { ascending: false })
              .limit(3),
            supabase
              .from("trainee_programs")
              .select("*, profiles:posted_by_user_id (is_verified, verification_badge)")
              .eq("status", "approved").gte("deadline", new Date().toISOString().slice(0, 10))
              .order("created_at", { ascending: false })
              .limit(3),
            supabase.from("theses").select("id", { count: "exact", head: true }).eq("status", "approved").gte("deadline", new Date().toISOString().slice(0, 10)).eq("type", "phd"),
            supabase.from("theses").select("id", { count: "exact", head: true }).eq("status", "approved").gte("deadline", new Date().toISOString().slice(0, 10)).eq("type", "master"),
            supabase.from("trainee_programs").select("id", { count: "exact", head: true }).eq("status", "approved").gte("deadline", new Date().toISOString().slice(0, 10)),
          ])

        setPlatformCounts({
          phd: phdCount.count || 0,
          master: masterCount.count || 0,
          programs: programCount.count || 0,
        })
        setTheses([...(phdResult.data || []), ...(masterResult.data || [])].map(mapThesis))
        setPrograms((programResult.data || []).map(mapProgram))
      } catch {
        console.error("Unable to load homepage data.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const stats = [
    { label: "PhD positions", value: platformCounts.phd, icon: GraduationCap, href: "/phd-positions" },
    { label: "Master's theses", value: platformCounts.master, icon: BookOpen, href: "/master-thesis" },
    { label: "Trainee programs", value: platformCounts.programs, icon: Briefcase, href: "/trainee-programs" },
  ]
  const activeTrackDetails = opportunityTracks.find((track) => track.id === activeTrack) || opportunityTracks[0]
  const activeOpportunities =
    activeTrack === "programs"
      ? programs
      : theses.filter((thesis) => thesis.type === activeTrack)
  const reportHref =
    "mailto:admin@graduatescorner.com?subject=Report%20a%20mistake%20on%20Graduates%20Corner&body=Page%20or%20listing%20URL%3A%0A%0AWhat%20looks%20incorrect%3A%0A"
  const questionHref =
    "mailto:admin@graduatescorner.com?subject=Question%20for%20Graduates%20Corner&body=Hello%20Graduates%20Corner%20team%2C%0A%0AMy%20question%3A%0A"

  return (
    <PublicLayout>
      <DiscoveryHero />

      <section className="border-y border-border/70 bg-card/80 px-4" aria-label="Available opportunities">
        <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-border/70">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group flex min-h-24 min-w-0 items-center justify-center gap-3 overflow-hidden px-1.5 py-4 text-center transition-colors hover:bg-secondary/55 sm:px-6"
            >
              <stat.icon className="hidden h-5 w-5 shrink-0 text-primary sm:block" />
              <div className="min-w-0">
                <span className="block text-2xl font-bold tabular-nums text-foreground sm:text-3xl" aria-live="polite">
                  {loading ? "--" : stat.value}
                </span>
                <span className="block break-words text-[11px] font-medium leading-tight text-muted-foreground sm:text-sm sm:leading-normal">
                  {stat.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 py-14 lg:py-18">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="outline" className="mb-3">Fresh opportunities</Badge>
              <h2 className="text-3xl font-bold text-foreground lg:text-4xl">{activeTrackDetails.title}</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">{activeTrackDetails.copy}</p>
            </div>
            <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-border bg-secondary/45 p-1" role="tablist" aria-label="Opportunity type">
              {opportunityTracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTrack === track.id}
                  onClick={() => setActiveTrack(track.id)}
                  className={`min-h-9 shrink-0 rounded-md px-3 text-sm font-semibold transition-colors ${
                    activeTrack === track.id
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {track.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="mt-8">
              <OpportunityGridSkeleton count={3} columns={3} />
            </div>
          ) : activeOpportunities.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="tabpanel">
              {activeTrack === "programs"
                ? programs.map((program) => <ProgramCard key={program.id} program={program} />)
                : (activeOpportunities as Thesis[]).map((thesis) => <ThesisCard key={thesis.id} thesis={thesis} />)}
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center border-b border-border/70 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-primary">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">Nothing published in this track yet</h3>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                {activeTrackDetails.empty} Check the full directory or switch to another opportunity type.
              </p>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <Link href={activeTrackDetails.href}>
              <Button variant="outline" className="gap-2">
                View all {activeTrackDetails.label.toLowerCase()}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-secondary/35 px-4 py-12">
        <div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Contact the administrator</p>
              <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                Found a mistake or need help?
              </h2>
              <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
                Send the listing or page link with a short explanation. Questions, corrections, safety reports, and partnership inquiries are welcome.
              </p>
              <a
                href="mailto:admin@graduatescorner.com"
                className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
              >
                admin@graduatescorner.com
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
            <a href={reportHref}>
              <Button className="w-full gap-2 sm:w-auto">
                <Flag className="h-4 w-4" />
                Report a mistake
              </Button>
            </a>
            <a href={questionHref}>
              <Button variant="outline" className="w-full gap-2 bg-background sm:w-auto">
                <Mail className="h-4 w-4" />
                Ask a question
              </Button>
            </a>
          </div>
        </div>
      </section>

      <RoleSelectionModal open={showRoleModal} onClose={() => setShowRoleModal(false)} />
    </PublicLayout>
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  )
}
