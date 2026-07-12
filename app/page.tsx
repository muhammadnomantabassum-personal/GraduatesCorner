"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { PublicLayout } from "@/components/layout/public-layout"
import { ThesisCard } from "@/components/shared/thesis-card"
import { ProgramCard } from "@/components/shared/program-card"
import { BlogCard } from "@/components/shared/blog-card"
import { TestimonialCard } from "@/components/shared/testimonial-card"
import { OpportunityIntelligencePanel } from "@/components/shared/opportunity-intelligence-panel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleSelectionModal } from "@/components/shared/role-selection-modal"
import { useAuth } from "@/lib/auth-context"
import type { BlogPost, Testimonial, Thesis, TraineeProgram } from "@/lib/data/types"
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  CalendarClock,
  Cpu,
  FileText,
  Globe2,
  GitCompareArrows,
  GraduationCap,
  Heart,
  Layers3,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wand2,
  X,
} from "lucide-react"

const quickFilters = [
  { href: "/master-thesis", label: "Master's thesis", icon: BookOpen },
  { href: "/phd-positions", label: "PhD positions", icon: GraduationCap },
  { href: "/trainee-programs", label: "Graduate programs", icon: Briefcase },
]

const audiences = [
  {
    id: "students",
    label: "Students",
    title: "Personalized discovery for ambitious graduates",
    copy: "Shortlist thesis, PhD, and trainee paths with filters for field, location, compensation, deadline, and organization.",
    cta: "Explore opportunities",
    href: "/master-thesis",
  },
  {
    id: "universities",
    label: "Universities",
    title: "A professional channel for research openings",
    copy: "Publish approved opportunities, showcase departments, and connect with candidates already looking for academic work.",
    cta: "Create university profile",
    href: "/register",
  },
  {
    id: "companies",
    label: "Companies",
    title: "Graduate talent pipelines with real intent",
    copy: "Promote thesis collaborations, trainee programs, and early-career roles to students who are ready to apply.",
    cta: "Post an opportunity",
    href: "/register",
  },
]

const platformPillars = [
  {
    title: "Opportunity intelligence",
    copy: "A focused marketplace that brings academic and graduate career paths into one searchable experience.",
    icon: Cpu,
  },
  {
    title: "Role-based workspaces",
    copy: "Student, university, company, and admin dashboards keep publishing, reviewing, and saving work organized.",
    icon: Layers3,
  },
  {
    title: "Decision-ready profiles",
    copy: "Cards surface field, deadline, compensation, organization, and location without forcing users into detail pages.",
    icon: Target,
  },
]

const userFriendlyFeatures = [
  {
    title: "One-click wishlist",
    copy: "Students can save thesis, PhD, and trainee opportunities from every card and return to a focused saved workspace.",
    icon: Heart,
    color: "text-[#ea4335]",
  },
  {
    title: "Deadline awareness",
    copy: "Opportunity cards surface time-left signals so candidates can prioritize urgent applications quickly.",
    icon: CalendarClock,
    color: "text-[#fbbc05]",
  },
  {
    title: "Side-by-side comparison",
    copy: "Compare up to three thesis, PhD, or trainee opportunities across funding, deadline, location, trust, and work mode.",
    icon: GitCompareArrows,
    color: "text-primary",
  },
  {
    title: "Guided journeys",
    copy: "Students, universities, and companies get clear paths into the actions that matter for their role.",
    icon: Sparkles,
    color: "text-[#34a853]",
  },
]

function HomePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { supabase, user } = useAuth()

  const [showRoleModal, setShowRoleModal] = useState(false)
  const [theses, setTheses] = useState<Thesis[]>([])
  const [programs, setPrograms] = useState<TraineeProgram[]>([])
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [activeAudience, setActiveAudience] = useState(audiences[0])
  const [platformCounts, setPlatformCounts] = useState({ phd: 0, master: 0, programs: 0, guides: 0 })
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const signup = searchParams.get("signup")
    if (signup === "success") {
      if (user) {
        router.push(user.type === "admin" ? "/n_admin/dashboard" : `/dashboard/${user.type}`)
      } else {
        setTimeout(() => setShowRoleModal(true), 0)
      }

      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete("signup")
      const queryString = newParams.toString()
      router.replace(queryString ? `/?${queryString}` : "/")
    }
  }, [searchParams, router, user])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [
          { data: thesesData },
          { data: progData },
          { data: postsData },
          { data: testData },
          phdCount,
          masterCount,
          programCount,
          guideCount,
        ] = await Promise.all([
          supabase.from("theses").select("*, profiles:posted_by_user_id (is_verified, verification_badge)").eq("status", "approved").limit(6),
          supabase.from("trainee_programs").select("*, profiles:posted_by_user_id (is_verified, verification_badge)").eq("status", "approved").limit(3),
          supabase.from("blog_posts").select("id, title, slug, excerpt, author, category, cover_image, created_at, read_time, status, posted_by_user_id, profiles(avatar)").eq("status", "approved").order("created_at", { ascending: false }).limit(3),
          supabase.from("testimonials").select("*, profiles(avatar)").eq("status", "approved").limit(3),
          supabase.from("theses").select("id", { count: "exact", head: true }).eq("status", "approved").eq("type", "phd"),
          supabase.from("theses").select("id", { count: "exact", head: true }).eq("status", "approved").eq("type", "master"),
          supabase.from("trainee_programs").select("id", { count: "exact", head: true }).eq("status", "approved"),
          supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "approved"),
        ])

        setPlatformCounts({
          phd: phdCount.count || 0,
          master: masterCount.count || 0,
          programs: programCount.count || 0,
          guides: guideCount.count || 0,
        })

        if (thesesData) {
          setTheses(thesesData.map((t: any) => ({
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
            organizationVerified: t.posted_by === "admin" || Boolean(t.profiles?.is_verified),
            verificationBadge: t.profiles?.verification_badge || "verified",
          })))
        }

        if (progData) {
          setPrograms(progData.map((p: any) => ({
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
            organizationVerified: p.posted_by === "admin" || Boolean(p.profiles?.is_verified),
            verificationBadge: p.profiles?.verification_badge || "verified",
          })))
        }

        if (postsData) {
          setPosts(postsData.map((p: any) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
            content: "",
            author: p.author,
            category: p.category,
            coverImage: p.cover_image,
            createdAt: p.created_at,
            readTime: p.read_time,
            status: p.status,
            postedByUserId: p.posted_by_user_id,
            authorAvatar: p.profiles?.avatar || undefined,
          })))
        }

        if (testData) {
          setTestimonials(testData.map((t: any) => ({
            id: t.id,
            author: t.author,
            role: t.role,
            organization: t.organization,
            content: t.content,
            rating: t.rating,
            status: t.status,
            createdAt: t.created_at,
            userId: t.user_id,
            avatar: t.profiles?.avatar || undefined,
          })))
        }
      } catch (err) {
        console.error("Fetch Data Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true)
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
          const data = await response.json()
          setSearchResults(data.results || [])
          setShowResults(true)
        } catch (error) {
          console.error("Search failed:", error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
        setShowResults(false)
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

  const featuredMasterTheses = theses.filter((t) => t.type === "master").slice(0, 3)
  const featuredPhDPositions = theses.filter((t) => t.type === "phd").slice(0, 3)
  const homeIntelligenceTotals = {
    total: theses.length + programs.length,
    funded:
      theses.filter((t) => t.compensation === "paid" || t.compensation === "stipend").length +
      programs.filter((p) => p.compensation === "paid" || p.compensation === "stipend").length,
    verified:
      theses.filter((t) => t.organizationVerified || t.postedBy === "admin").length +
      programs.filter((p) => p.organizationVerified || p.postedBy === "admin").length,
    locations: new Set([...theses.map((t) => t.location), ...programs.map((p) => p.location)]).size,
    organizations: new Set([...theses.map((t) => t.organization), ...programs.map((p) => p.company)]).size,
  }

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
    if (searchResults[0]) {
      router.push(getResultLink(searchResults[0]))
      setShowResults(false)
      return
    }

    if (searchQuery.trim().length >= 2) setShowResults(true)
  }

  const stats = [
    { label: "PhD positions", value: platformCounts.phd, icon: GraduationCap },
    { label: "Master's theses", value: platformCounts.master, icon: BookOpen },
    { label: "Trainee programs", value: platformCounts.programs, icon: Briefcase },
    { label: "Career guides", value: platformCounts.guides, icon: FileText },
  ]

  return (
    <PublicLayout>
      <section className="relative min-h-[640px] overflow-hidden px-4 pb-24 pt-16 text-primary-foreground sm:min-h-[680px] lg:pb-28 lg:pt-24">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=2400&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(7,31,68,0.96)_0%,rgba(20,66,135,0.90)_48%,rgba(16,58,103,0.48)_78%,rgba(8,35,60,0.35)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent_0%,var(--background)_100%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col justify-center">
          <div className="max-w-3xl">
            <Badge className="mb-6 gap-2 border border-primary-foreground/20 bg-primary-foreground/12 px-3 py-1.5 text-primary-foreground shadow-sm backdrop-blur hover:bg-primary-foreground/18">
              <Sparkles className="h-3.5 w-3.5" />
              Academic and early-career opportunities
            </Badge>
            <h1 className="max-w-4xl text-balance text-5xl font-bold leading-[1.04] text-primary-foreground sm:text-6xl lg:text-7xl">
              Graduates Corner
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-primary-foreground/82 lg:text-xl">
              Discover credible master&apos;s theses, PhD positions, and graduate programs from universities and companies around the world.
            </p>

            <div className="relative mt-8 max-w-2xl" ref={searchRef}>
              <form
                onSubmit={handleSearchSubmit}
                role="search"
                className="relative flex flex-col gap-2 rounded-xl border border-primary-foreground/20 bg-primary-foreground/14 p-2 shadow-[0_24px_80px_rgba(4,20,46,0.28)] backdrop-blur-xl sm:flex-row"
              >
                <div className="flex min-h-14 flex-1 items-center gap-3 rounded-xl bg-card px-4 shadow-inner">
                  <Search className="h-5 w-5 shrink-0 text-primary" />
                  <input
                    type="text"
                    placeholder="Search thesis, PhD, trainee programs, topics..."
                    aria-label="Search opportunities and guides"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                    className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="rounded-full p-1 hover:bg-muted" aria-label="Clear search">
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
                        Search Results
                      </div>
                      {searchResults.map((result) => (
                        <Link
                          key={`${result.category}-${result.id}`}
                          href={getResultLink(result)}
                          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary"
                          onClick={() => setShowResults(false)}
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
                              <span>-</span>
                              <span className="truncate">{result.meta}</span>
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Search className="mb-3 h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-foreground">
                        No results found for &quot;{searchQuery}&quot;
                      </p>
                      <p className="text-xs text-muted-foreground">Try a field, company, university, or topic.</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
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

          <div className="mt-10 grid max-w-3xl gap-3 border-t border-primary-foreground/18 pt-5 text-sm text-primary-foreground/78 sm:grid-cols-3">
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

      <section className="relative -mt-16 px-4 pb-12">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-card/94 p-4 shadow-[0_22px_70px_rgba(66,133,244,0.14)] backdrop-blur lg:grid-cols-4 lg:gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl bg-secondary/55 p-4 text-center ring-1 ring-border/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(66,133,244,0.20)]">
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-3xl font-bold tabular-nums text-foreground">{loading ? "--" : stat.value}</span>
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <OpportunityIntelligencePanel
        defaultTrack="phd"
        totals={homeIntelligenceTotals}
        className="-mt-4 pb-12 pt-0"
      />

      <section className="px-4 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-3">
            {platformPillars.map((pillar) => (
              <div key={pillar.title} className="premium-border rounded-2xl bg-card/86 p-6 shadow-sm">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 rounded-3xl border border-border bg-[linear-gradient(135deg,#ffffff_0%,#f5f9ff_48%,#edf8f1_100%)] p-6 shadow-sm lg:grid-cols-[0.85fr_1.15fr] lg:p-8">
            <div className="flex flex-col justify-center">
              <Badge variant="outline" className="mb-4 w-fit gap-2 bg-white/70">
                <Heart className="h-3.5 w-3.5 text-[#ea4335]" />
                Built around user momentum
              </Badge>
              <h2 className="text-balance text-3xl font-bold text-foreground lg:text-4xl">
                Save, compare, and act on the right opportunities.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground lg:text-base">
                Graduates Corner now makes shortlist building more visible, deadline decisions faster, and exploration more personal for every visitor.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register">
                  <Button className="gap-2 rounded-xl">
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard/student/wishlist">
                  <Button variant="outline" className="gap-2 rounded-xl bg-white/80">
                    Open wishlist
                    <Heart className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {userFriendlyFeatures.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                    <feature.icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/55 px-4 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge variant="outline" className="mb-4 gap-2">
              <Users className="h-3.5 w-3.5" />
              Built for every role
            </Badge>
            <h2 className="text-balance text-3xl font-bold text-foreground lg:text-4xl">
              One platform, three professional journeys.
            </h2>
            <p className="mt-4 text-muted-foreground">
              The public experience now introduces the product as a serious talent and research platform, not just a listing board.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              {audiences.map((audience) => (
                <button
                  key={audience.id}
                  onClick={() => setActiveAudience(audience)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                    activeAudience.id === audience.id
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {audience.label}
                </button>
              ))}
            </div>
            <div className="premium-border rounded-2xl bg-background/80 p-6 shadow-sm">
              <h3 className="text-2xl font-bold text-foreground">{activeAudience.title}</h3>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{activeAudience.copy}</p>
              <Link href={activeAudience.href} className="mt-6 inline-flex">
                <Button className="gap-2 rounded-xl">
                  {activeAudience.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading opportunities...</p>
        </div>
      ) : (
        <>
          <OpportunitySection
            title="Featured PhD Positions"
            copy="Doctoral and research roles from universities and research institutions."
            href="/phd-positions"
            empty="No PhD positions available at the moment."
          >
            {featuredPhDPositions.map((thesis) => (
              <ThesisCard key={thesis.id} thesis={thesis} />
            ))}
          </OpportunitySection>

          <OpportunitySection
            title="Master's Thesis Positions"
            copy="Industry and university thesis projects for focused academic work."
            href="/master-thesis"
            empty="No master's thesis available at the moment."
            tinted
          >
            {featuredMasterTheses.map((thesis) => (
              <ThesisCard key={thesis.id} thesis={thesis} />
            ))}
          </OpportunitySection>

          <OpportunitySection
            title="Graduate Trainee Programs"
            copy="Structured early-career programs from companies building future leaders."
            href="/trainee-programs"
            empty="No trainee programs available at the moment."
          >
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </OpportunitySection>

          <OpportunitySection
            title="Career Intelligence"
            copy="Guides, stories, and insights for sharper academic and career decisions."
            href="/blog"
            empty="No blog posts available."
            tinted
          >
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </OpportunitySection>

          <section className="px-4 py-16 lg:py-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-10 text-center">
                <Badge variant="outline" className="mb-4">Community proof</Badge>
                <h2 className="mb-2 text-3xl font-bold text-foreground lg:text-4xl">
                  Trusted by the people building the next step.
                </h2>
                <p className="text-muted-foreground">
                  Students, universities, and companies use Graduates Corner to move faster with more confidence.
                </p>
              </div>
              {testimonials.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {testimonials.map((t) => (
                    <TestimonialCard key={t.id} testimonial={t} />
                  ))}
                </div>
              ) : (
                <p className="py-10 text-center text-muted-foreground">No testimonials available.</p>
              )}
            </div>
          </section>
        </>
      )}

      <section className="px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#1a73e8_0%,#4285f4_48%,#34a853_100%)] px-8 py-12 text-center text-primary-foreground shadow-[0_24px_80px_rgba(66,133,244,0.24)] ring-1 ring-primary/20 lg:px-16 lg:py-16">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1800&auto=format&fit=crop')",
              }}
            />
            <div className="relative">
              <Badge className="mb-5 border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
                Production-ready platform experience
              </Badge>
              <h2 className="mb-4 text-balance text-3xl font-bold lg:text-4xl">
                Start building your graduate pipeline today.
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-primary-foreground/80">
                Create an account, save opportunities, publish openings, and connect with the right academic or professional next step.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="gap-2 rounded-xl bg-white text-[#1a73e8] shadow-[0_14px_32px_rgba(255,255,255,0.24)] hover:bg-white/92">
                    <GraduationCap className="h-5 w-5" />
                    Create Free Account
                  </Button>
                </Link>
                <Link href="/about">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 rounded-xl border-primary-foreground/30 bg-primary-foreground/8 text-primary-foreground backdrop-blur hover:bg-primary-foreground/14 hover:text-primary-foreground"
                  >
                    <MapPin className="h-5 w-5" />
                    Explore Platform
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RoleSelectionModal open={showRoleModal} onClose={() => setShowRoleModal(false)} />
    </PublicLayout>
  )
}

function OpportunitySection({
  title,
  copy,
  href,
  empty,
  tinted = false,
  children,
}: {
  title: string
  copy: string
  href: string
  empty: string
  tinted?: boolean
  children: React.ReactNode
}) {
  const childArray = Array.isArray(children) ? children : [children]
  const hasChildren = childArray.some(Boolean)

  return (
    <section className={`px-4 py-16 lg:py-20 ${tinted ? "border-y border-border/50 bg-card/55" : ""}`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 border-b border-border/70 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-foreground lg:text-3xl">{title}</h2>
            <p className="max-w-2xl text-muted-foreground">{copy}</p>
          </div>
          <Link href={href}>
            <Button variant="ghost" className="gap-2 text-primary">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {hasChildren ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{children}</div>
        ) : (
          <p className="py-10 text-center text-muted-foreground">{empty}</p>
        )}
      </div>
    </section>
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
