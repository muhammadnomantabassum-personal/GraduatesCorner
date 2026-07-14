"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { PublicLayout } from "@/components/layout/public-layout"
import { ThesisCard } from "@/components/shared/thesis-card"
import { ProgramCard } from "@/components/shared/program-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleSelectionModal } from "@/components/shared/role-selection-modal"
import { useAuth } from "@/lib/auth-context"
import { trackAnalyticsEvent } from "@/lib/analytics"
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const { supabase, user } = useAuth()
  const searchRef = useRef<HTMLDivElement>(null)

  const [showRoleModal, setShowRoleModal] = useState(false)
  const [theses, setTheses] = useState<Thesis[]>([])
  const [programs, setPrograms] = useState<TraineeProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [activeTrack, setActiveTrack] = useState<OpportunityTrack>("phd")
  const [platformCounts, setPlatformCounts] = useState({ phd: 0, master: 0, programs: 0 })

  useEffect(() => {
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
  }, [searchParams, router, user])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [phdResult, masterResult, programResult, phdCount, masterCount, programCount] =
          await Promise.all([
            supabase
              .from("theses")
              .select("*, profiles:posted_by_user_id (is_verified, verification_badge)")
              .eq("status", "approved")
              .eq("type", "phd")
              .order("created_at", { ascending: false })
              .limit(3),
            supabase
              .from("theses")
              .select("*, profiles:posted_by_user_id (is_verified, verification_badge)")
              .eq("status", "approved")
              .eq("type", "master")
              .order("created_at", { ascending: false })
              .limit(3),
            supabase
              .from("trainee_programs")
              .select("*, profiles:posted_by_user_id (is_verified, verification_badge)")
              .eq("status", "approved")
              .order("created_at", { ascending: false })
              .limit(3),
            supabase.from("theses").select("id", { count: "exact", head: true }).eq("status", "approved").eq("type", "phd"),
            supabase.from("theses").select("id", { count: "exact", head: true }).eq("status", "approved").eq("type", "master"),
            supabase.from("trainee_programs").select("id", { count: "exact", head: true }).eq("status", "approved"),
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        setShowResults(false)
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()
        setSearchResults(data.results || [])
        setShowResults(true)
      } catch {
        console.error("Homepage search failed.")
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getResultIcon = (category: string) => {
    switch (category) {
      case "thesis":
        return <BookOpen className="h-4 w-4" />
      case "phd":
        return <GraduationCap className="h-4 w-4" />
      case "program":
        return <Briefcase className="h-4 w-4" />
      case "blog":
        return <FileText className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getResultLink = (result: any) => {
    switch (result.category) {
      case "thesis":
        return `/theses/${result.id}`
      case "phd":
        return `/phd-positions/${result.id}`
      case "program":
        return `/trainee-programs/${result.id}`
      case "blog":
        return `/blog/${result.slug || result.id}`
      default:
        return "#"
    }
  }

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    trackAnalyticsEvent("search_performed", {
      result_count: searchResults.length,
      has_results: searchResults.length > 0,
      interaction: "submit",
    })
    if (searchResults[0]) {
      router.push(getResultLink(searchResults[0]))
      setShowResults(false)
      return
    }

    if (searchQuery.trim().length >= 2) setShowResults(true)
  }

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
      <section className="relative min-h-[570px] overflow-hidden px-4 pb-20 pt-14 text-primary-foreground sm:min-h-[600px] lg:pt-20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=2400&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(7,31,68,0.96)_0%,rgba(20,66,135,0.90)_48%,rgba(16,58,103,0.48)_78%,rgba(8,35,60,0.35)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent_0%,var(--background)_100%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col justify-center">
          <div className="max-w-3xl">
            <Badge className="mb-5 gap-2 border border-primary-foreground/20 bg-primary-foreground/12 px-3 py-1.5 text-primary-foreground shadow-sm backdrop-blur hover:bg-primary-foreground/18">
              <Sparkles className="h-3.5 w-3.5" />
              Academic and early-career opportunities
            </Badge>
            <h1 className="max-w-full text-balance break-words text-4xl font-bold leading-[1.08] text-primary-foreground sm:text-6xl sm:leading-[1.04] lg:max-w-4xl lg:text-7xl">
              Graduates Corner
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-primary-foreground/82 lg:text-xl">
              Find credible master&apos;s theses, PhD positions, and graduate programs from universities and companies worldwide.
            </p>

            <div className="relative mt-7 max-w-2xl" ref={searchRef}>
              <form
                onSubmit={handleSearchSubmit}
                role="search"
                className="relative flex flex-col gap-2 rounded-xl border border-primary-foreground/20 bg-primary-foreground/14 p-2 shadow-[0_24px_80px_rgba(4,20,46,0.28)] backdrop-blur-xl sm:flex-row"
              >
                <div className="flex min-h-14 flex-1 items-center gap-3 rounded-xl bg-card px-4 shadow-inner">
                  <Search className="h-5 w-5 shrink-0 text-primary" />
                  <input
                    type="text"
                    placeholder="Search field, university, company, or country"
                    aria-label="Search opportunities and guides"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                    className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="rounded-full p-1 hover:bg-muted"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <Button type="submit" className="min-h-14 shrink-0 gap-2 rounded-xl px-6 font-semibold shadow-[0_14px_32px_rgba(66,133,244,0.24)]">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  Search
                </Button>
              </form>

              {showResults && (
                <div className="absolute left-0 right-0 z-50 mt-2 max-h-[400px] overflow-y-auto rounded-xl border border-border bg-card p-2 text-foreground shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 lg:right-auto lg:w-[42rem]">
                  {searchResults.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      <div className="px-3 py-2 text-[10px] font-bold uppercase text-muted-foreground">
                        Search results
                      </div>
                      {searchResults.map((result) => (
                        <Link
                          key={`${result.category}-${result.id}`}
                          href={getResultLink(result)}
                          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary"
                          onClick={() => {
                            trackAnalyticsEvent("search_performed", {
                              result_count: searchResults.length,
                              has_results: true,
                              interaction: "result_click",
                              selected_category: result.category,
                            })
                            setShowResults(false)
                          }}
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            {getResultIcon(result.category)}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                              {result.title}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="capitalize">{result.category}</span>
                              <span aria-hidden="true">-</span>
                              <span className="truncate">{result.meta}</span>
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Search className="mb-3 h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-foreground">
                        No results found for &quot;{searchQuery}&quot;
                      </p>
                      <p className="text-xs text-muted-foreground">Try a field, company, university, or country.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              {quickFilters.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="outline"
                    className="gap-2 rounded-xl border-primary-foreground/25 bg-primary-foreground/8 text-primary-foreground backdrop-blur hover:bg-primary-foreground/16 hover:text-primary-foreground"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 grid max-w-3xl gap-3 border-t border-primary-foreground/18 pt-5 text-sm text-primary-foreground/78 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#76d58f]" />
              Verified organizations
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-[#ffd76a]" />
              Deadline-aware discovery
            </div>
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-[#8ab4f8]" />
              International coverage
            </div>
          </div>
        </div>
      </section>

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
                <span className="block text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
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
            <div className="flex min-h-72 flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Loading opportunities...</p>
            </div>
          ) : activeOpportunities.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="tabpanel">
              {activeTrack === "programs"
                ? programs.map((program) => <ProgramCard key={program.id} program={program} />)
                : (activeOpportunities as Thesis[]).map((thesis) => <ThesisCard key={thesis.id} thesis={thesis} />)}
            </div>
          ) : (
            <p className="py-20 text-center text-muted-foreground">{activeTrackDetails.empty}</p>
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

      <section className="border-y border-border/70 bg-[linear-gradient(135deg,#f7faff_0%,#eef6ff_52%,#edf8f1_100%)] px-4 py-12">
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
              <Button variant="outline" className="w-full gap-2 bg-background/80 sm:w-auto">
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
