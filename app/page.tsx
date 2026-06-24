"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { PublicLayout } from "@/components/layout/public-layout"
import { ThesisCard } from "@/components/shared/thesis-card"
import { ProgramCard } from "@/components/shared/program-card"
import { BlogCard } from "@/components/shared/blog-card"
import { TestimonialCard } from "@/components/shared/testimonial-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { RoleSelectionModal } from "@/components/shared/role-selection-modal"
import type { Thesis, TraineeProgram, BlogPost, Testimonial } from "@/lib/data/types"
import {
  Search,
  ArrowRight,
  BookOpen,
  Briefcase,
  GraduationCap,
  Building2,
  Users,
  FileText,
  Loader2,
  X,
} from "lucide-react"

const stats = [
  { label: "Thesis Position", value: "850+", icon: FileText },
  { label: "Trainee Programs", value: "320+", icon: Briefcase },
  { label: "Partner Universities", value: "120+", icon: GraduationCap },
  { label: "Active Students", value: "15,000+", icon: Users },
]

function HomePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showRoleModal, setShowRoleModal] = useState(false)

  const { supabase, user } = useAuth()
  const [theses, setTheses] = useState<Thesis[]>([])
  const [programs, setPrograms] = useState<TraineeProgram[]>([])
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const signup = searchParams.get('signup')
    if (signup === 'success') {
      if (user) {
        // If user is already loaded, redirect directly to their dashboard
        router.push(user.type === 'admin' ? '/n_admin/dashboard' : `/dashboard/${user.type}`)
      } else {
        // Fallback to modal if user state isn't ready, but with new register flow 
        // they should mostly be redirected from auth/callback
        setShowRoleModal(true)
      }

      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('signup')
      const queryString = newParams.toString()
      router.replace(queryString ? `/?${queryString}` : '/')
    }
  }, [searchParams, router, user])

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [
          { data: thesesData },
          { data: progData },
          { data: postsData },
          { data: testData }
        ] = await Promise.all([
          supabase.from('theses').select('*').eq('status', 'approved').limit(6),
          supabase.from('trainee_programs').select('*').eq('status', 'approved').limit(3),
          supabase.from('blog_posts').select('*, profiles(avatar)').eq('status', 'approved').order('created_at', { ascending: false }).limit(3),
          supabase.from('testimonials').select('*, profiles(avatar)').eq('status', 'approved').limit(3)
        ])

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
          })))
        }

        if (postsData) {
          setPosts(postsData.map((p: any) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
            content: p.content,
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

  // Handle Search
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

  // Close results when clicking outside
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

  const getResultIcon = (category: string) => {
    switch (category) {
      case 'thesis': return <BookOpen className="h-4 w-4" />
      case 'program': return <Briefcase className="h-4 w-4" />
      case 'blog': return <FileText className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
  }

  const getResultLink = (result: any) => {
    switch (result.category) {
      case 'thesis': return `/theses/${result.id}`
      case 'program': return `/trainee-programs/${result.id}`
      case 'blog': return `/blog/${result.slug || result.id}`
      default: return '#'
    }
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative min-h-[680px] overflow-hidden px-4 py-20 text-primary-foreground lg:py-28">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=2200&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,53,48,0.94)_0%,rgba(15,53,48,0.82)_44%,rgba(15,53,48,0.44)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(180deg,transparent_0%,var(--background)_100%)]" />
        <div className="relative mx-auto flex max-w-7xl items-center">
          <div className="max-w-3xl">
            <Badge className="mb-6 border border-primary-foreground/20 bg-primary-foreground/12 px-3 py-1 text-primary-foreground shadow-sm backdrop-blur hover:bg-primary-foreground/18">
              Trusted by 120+ Universities & Companies
            </Badge>
            <h1 className="mb-6 max-w-3xl text-balance text-5xl font-bold text-primary-foreground lg:text-6xl xl:text-7xl">
              Shape your next academic move with Graduates Corner
            </h1>
            <h2 className="mb-8 max-w-2xl text-pretty text-lg font-normal leading-relaxed text-primary-foreground/82 lg:text-xl">
              Discover master thesis, PhD positions, and graduate trainee programs from top
              universities and leading companies across Sweden and all over the world.
            </h2>

            {/* Functional Search Bar */}
            <div className="relative max-w-2xl" ref={searchRef}>
              <div className="surface-glass flex flex-col gap-2 rounded-2xl border border-primary-foreground/18 bg-primary-foreground/12 p-2 backdrop-blur-xl sm:flex-row">
                <div className="flex min-h-12 flex-1 items-center gap-3 rounded-xl bg-card px-4 shadow-inner">
                  <Search className="h-5 w-5 shrink-0 text-primary" />
                  <input
                    type="text"
                    placeholder="Search thesis, programs, topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                    className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="rounded-full p-1 hover:bg-muted">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <Button className="min-h-12 shrink-0 rounded-xl bg-accent px-6 font-semibold text-accent-foreground shadow-[0_12px_28px_rgba(184,116,38,0.28)] hover:bg-accent/90">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>

              {/* Search Results Dropdown */}
              {showResults && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-[400px] overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                  {searchResults.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Search Results
                      </div>
                      {searchResults.map((result) => (
                        <Link
                          key={`${result.category}-${result.id}`}
                          href={getResultLink(result)}
                          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-secondary transition-colors"
                          onClick={() => setShowResults(false)}
                        >
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${result.category === 'thesis' ? 'bg-primary/10 text-primary' :
                            result.category === 'program' ? 'bg-accent/10 text-accent' :
                              'bg-emerald-500/10 text-emerald-600'
                            }`}>
                            {getResultIcon(result.category)}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                              {result.title}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="capitalize">{result.category}</span>
                              <span>•</span>
                              <span className="truncate">{result.meta}</span>
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </Link>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Search className="mb-3 h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-foreground">No results found for "{searchQuery}"</p>
                      <p className="text-xs text-muted-foreground">Try different keywords or check your spelling</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/master-thesis">
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl border-primary-foreground/30 bg-primary-foreground/8 text-primary-foreground backdrop-blur hover:bg-primary-foreground/16 hover:text-primary-foreground"
                >
                  <BookOpen className="h-4 w-4" />
                  Master's Thesis
                </Button>
              </Link>
              <Link href="/phd-positions">
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl border-primary-foreground/30 bg-primary-foreground/8 text-primary-foreground backdrop-blur hover:bg-primary-foreground/16 hover:text-primary-foreground"
                >
                  <GraduationCap className="h-4 w-4" />
                  PhD Positions
                </Button>
              </Link>
              <Link href="/trainee-programs">
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl border-primary-foreground/30 bg-primary-foreground/8 text-primary-foreground backdrop-blur hover:bg-primary-foreground/16 hover:text-primary-foreground"
                >
                  <Briefcase className="h-4 w-4" />
                  Trainee Programs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-16 px-4 pb-12">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-card/92 p-4 shadow-[0_22px_70px_rgba(22,70,65,0.12)] backdrop-blur lg:grid-cols-4 lg:gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl bg-secondary/55 p-4 text-center ring-1 ring-border/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-3xl font-bold text-foreground">{stat.value}</span>
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading opportunities...</p>
        </div>
      ) : (
        <>
          {/* PhD Positions */}
          <section className="px-4 py-16 lg:py-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-10 flex items-end justify-between border-b border-border/70 pb-5">
                <div>
                  <h3 className="mb-2 text-2xl font-bold text-foreground lg:text-3xl">
                    PhD Positions
                  </h3>
                  <p className="text-muted-foreground">
                    Find PhD positions and doctoral opportunities from top institutions
                  </p>
                </div>
                <Link href="/phd-positions" className="hidden md:block">
                  <Button variant="ghost" className="gap-2 text-primary">
                    View All <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {featuredPhDPositions.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {featuredPhDPositions.map((thesis) => (
                    <ThesisCard key={thesis.id} thesis={thesis} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-10">No PhD positions available at the moment.</p>
              )}
              <div className="mt-6 text-center md:hidden">
                <Link href="/phd-positions">
                  <Button variant="outline" className="gap-2">
                    View All <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Master's Thesis Positions */}
          <section className="border-y border-border/50 bg-card/58 px-4 py-16 lg:py-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-10 flex items-end justify-between border-b border-border/70 pb-5">
                <div>
                  <h3 className="mb-2 text-2xl font-bold text-foreground lg:text-3xl">
                    Master's Thesis Positions
                  </h3>
                  <p className="text-muted-foreground">
                    Discover master's thesis opportunities from leading universities
                  </p>
                </div>
                <Link href="/master-thesis" className="hidden md:block">
                  <Button variant="ghost" className="gap-2 text-primary">
                    View All <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {featuredMasterTheses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {featuredMasterTheses.map((thesis) => (
                    <ThesisCard key={thesis.id} thesis={thesis} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-10">No master's thesis available at the moment.</p>
              )}
              <div className="mt-6 text-center md:hidden">
                <Link href="/master-thesis">
                  <Button variant="outline" className="gap-2">
                    View All <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Featured Trainee Programs */}
          <section className="px-4 py-16 lg:py-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-10 flex items-end justify-between border-b border-border/70 pb-5">
                <div>
                  <h3 className="mb-2 text-2xl font-bold text-foreground lg:text-3xl">
                    Graduate Trainee Programs
                  </h3>
                  <p className="text-muted-foreground">
                    Launch your career with leading companies
                  </p>
                </div>
                <Link href="/trainee-programs" className="hidden md:block">
                  <Button variant="ghost" className="gap-2 text-primary">
                    View All <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {programs.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {programs.map((program) => (
                    <ProgramCard key={program.id} program={program} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-10">No trainee programs available at the moment.</p>
              )}
              <div className="mt-6 text-center md:hidden">
                <Link href="/trainee-programs">
                  <Button variant="outline" className="gap-2">
                    View All Programs <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Blog Highlights */}
          <section className="border-y border-border/50 bg-card/58 px-4 py-16 lg:py-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-10 flex items-end justify-between border-b border-border/70 pb-5">
                <div>
                  <h3 className="mb-2 text-2xl font-bold text-foreground lg:text-3xl">From Our Blog</h3>
                  <p className="text-muted-foreground">
                    Career tips, academic insights, and success stories
                  </p>
                </div>
                <Link href="/blog" className="hidden md:block">
                  <Button variant="ghost" className="gap-2 text-primary">
                    Read More <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {posts.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-10">No blog posts available.</p>
              )}
            </div>
          </section>

          {/* Testimonials */}
          <section className="px-4 py-16 lg:py-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-10 text-center">
                <h3 className="mb-2 text-2xl font-bold text-foreground lg:text-3xl">
                  What Our Community Says
                </h3>
                <p className="text-muted-foreground">
                  Hear from students, universities, and companies who use Graduates Corner
                </p>
              </div>
              {testimonials.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {testimonials.map((t) => (
                    <TestimonialCard key={t.id} testimonial={t} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-10">No testimonials available.</p>
              )}
            </div>
          </section>
        </>
      )}

      {/* CTA Section */}
      <section className="px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-12 text-center text-primary-foreground shadow-[0_24px_80px_rgba(22,70,65,0.20)] ring-1 ring-primary/20 lg:px-16 lg:py-16">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1800&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-primary/84" />
            <div className="relative">
            <h2 className="mb-4 text-balance text-3xl font-bold lg:text-4xl">
              Ready to Start Your Journey?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-primary-foreground/80">
              Whether you are a student looking for opportunities, a university posting positions, or a
              company seeking fresh talent, Graduates Corner connects you with the right people.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="gap-2 rounded-xl bg-accent text-accent-foreground shadow-[0_14px_32px_rgba(184,116,38,0.30)] hover:bg-accent/90"
                >
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
                  <Building2 className="h-5 w-5" />
                  Learn More
                </Button>
              </Link>
            </div>
            </div>
          </div>
        </div>
      </section>

      <RoleSelectionModal
        open={showRoleModal}
        onClose={() => setShowRoleModal(false)}
      />
    </PublicLayout>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
