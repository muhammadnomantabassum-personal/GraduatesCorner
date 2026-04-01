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
          supabase.from('blog_posts').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(3),
          supabase.from('testimonials').select('*').eq('status', 'approved').limit(3)
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
      <section className="relative overflow-hidden bg-primary px-4 py-20 text-primary-foreground lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-6 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20">
              Trusted by 120+ Universities & Companies
            </Badge>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight lg:text-5xl xl:text-6xl">
              Find Your Perfect Academic Opportunity
            </h1>
            <h2 className="mb-8 text-pretty text-lg leading-relaxed text-primary-foreground/80 lg:text-xl font-normal">
              Discover master thesis, PhD positions, and graduate trainee programs from top
              universities and leading companies across Europe and beyond.
            </h2>

            {/* Functional Search Bar */}
            <div className="relative mx-auto max-w-xl" ref={searchRef}>
              <div className="flex items-center gap-2 rounded-lg bg-primary-foreground/10 p-2 backdrop-blur-sm">
                <div className="flex flex-1 items-center gap-2 rounded-md bg-card px-4 py-2.5">
                  <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search thesis, programs, topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="p-1 hover:bg-muted rounded-full">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <Button className="shrink-0 bg-accent text-accent-foreground hover:bg-accent/90">
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

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/master-thesis">
                <Button
                  variant="outline"
                  className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <BookOpen className="h-4 w-4" />
                  Master's Thesis
                </Button>
              </Link>
              <Link href="/phd-positions">
                <Button
                  variant="outline"
                  className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <GraduationCap className="h-4 w-4" />
                  PhD Positions
                </Button>
              </Link>
              <Link href="/trainee-programs">
                <Button
                  variant="outline"
                  className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
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
      <section className="border-b border-border bg-card px-4 py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
              <stat.icon className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold text-foreground">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
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
              <div className="mb-10 flex items-end justify-between">
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
          <section className="bg-secondary/50 px-4 py-16 lg:py-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-10 flex items-end justify-between">
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
              <div className="mb-10 flex items-end justify-between">
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
          <section className="bg-secondary/50 px-4 py-16 lg:py-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-10 flex items-end justify-between">
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
                  Hear from students, universities, and companies who use GradNexus
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
          <div className="rounded-2xl bg-primary px-8 py-12 text-center text-primary-foreground lg:px-16 lg:py-16">
            <h2 className="mb-4 text-balance text-3xl font-bold lg:text-4xl">
              Ready to Start Your Journey?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-primary-foreground/80">
              Whether you are a student looking for opportunities, a university posting positions, or a
              company seeking fresh talent — GradNexus connects you with the right people.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <GraduationCap className="h-5 w-5" />
                  Create Free Account
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Building2 className="h-5 w-5" />
                  Learn More
                </Button>
              </Link>
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
