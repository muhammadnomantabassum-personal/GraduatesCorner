"use client"

import { useState, useMemo, useEffect, type ElementType } from "react"
import { PublicLayout } from "@/components/layout/public-layout"
import { BlogCard } from "@/components/shared/blog-card"
import { useAuth } from "@/lib/auth-context"
import type { BlogPost } from "@/lib/data/types"
import { Search, X, BookOpenText, Newspaper, Clock, Sparkles, UserRound, TrendingUp } from "lucide-react"

export default function BlogPage() {
  const { supabase } = useAuth()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      // PERFORMANCE OPTIMIZATION: Only select fields needed for the listing
      // Excluding 'content' field as it can be very large and is not needed on this page
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, profiles(avatar)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching blog posts:', error)
      } else {
        const formattedData = data.map((p: any) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          content: "", // Content not needed for listing
          author: p.author,
          category: p.category,
          coverImage: p.cover_image,
          createdAt: p.created_at,
          readTime: p.read_time,
          status: p.status,
          postedByUserId: p.posted_by_user_id,
          authorAvatar: p.profiles?.avatar || undefined,
        }))
        setPosts(formattedData)
      }
      setLoading(false)
    }

    fetchPosts()
  }, [supabase])

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(posts.map((p) => p.category)))]
  }, [posts])

  const filtered = useMemo(() => {
    return posts
      .filter((p) => {
        if (search) {
          const q = search.toLowerCase()
          return (
            p.title.toLowerCase().includes(q) ||
            p.excerpt.toLowerCase().includes(q) ||
            p.author.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
          )
        }
        return true
      })
      .filter((p) => (activeCategory === "All" ? true : p.category === activeCategory))
  }, [posts, search, activeCategory])

  const featuredPost = filtered[0]
  const restPosts = filtered.slice(1)
  const authorCount = new Set(posts.map((post) => post.author)).size
  const totalReadMinutes = posts.reduce((sum, post) => sum + Number.parseInt(post.readTime || "0", 10), 0)
  const categoryHighlights = categories.filter((category) => category !== "All").slice(0, 4)

  return (
    <PublicLayout>
      <section className="relative overflow-hidden px-4 py-16 text-primary-foreground lg:py-20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=2200&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(15,23,42,0.94)_0%,rgba(66,133,244,0.78)_50%,rgba(139,92,246,0.48)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_24%,rgba(251,188,5,0.20),transparent_20rem),radial-gradient(circle_at_22%_76%,rgba(52,168,83,0.16),transparent_24rem)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_24rem] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <BookOpenText className="h-3.5 w-3.5" />
              Career intelligence journal
            </div>
            <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight lg:text-6xl">Graduates Corner Blog</h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-white/82">
              Read expert guidance, academic insights, success stories, and market signals for smarter graduate decisions.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {categoryHighlights.length > 0 ? categoryHighlights.map((category) => (
                <button key={category} onClick={() => setActiveCategory(category)} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/18">
                  {category}
                </button>
              )) : ["Careers", "Research", "Applications", "Success"].map((category) => (
                <button key={category} onClick={() => setSearch(category)} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/18">
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/18 bg-white/12 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.16)] backdrop-blur-xl">
            <p className="text-sm font-semibold text-white/78">Editorial intelligence</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <HeroMetric icon={Newspaper} label="Articles" value={posts.length} />
              <HeroMetric icon={Sparkles} label="Categories" value={Math.max(0, categories.length - 1)} />
              <HeroMetric icon={UserRound} label="Authors" value={authorCount} />
              <HeroMetric icon={Clock} label="Read mins" value={totalReadMinutes} />
            </div>
          </div>
        </div>
      </section>

      <section className="relative -mt-8 px-4 pb-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-border bg-card/95 p-3 shadow-[0_24px_80px_rgba(66,133,244,0.16)] backdrop-blur">
          <div className="flex min-h-12 items-center gap-3 rounded-xl bg-background px-4">
            <Search className="h-5 w-5 shrink-0 text-primary" />
            <input
              type="text"
              placeholder="Search articles, authors, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Editorial library</h2>
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filtered.length}</span> {filtered.length === 1 ? "article" : "articles"} for graduate growth
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <TrendingUp className="h-3.5 w-3.5" />
                Insight-led guidance
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(66,133,244,0.18)]"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
                   <div className="aspect-video w-full animate-pulse rounded-lg bg-muted" />
                   <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                   <div className="h-4 w-full animate-pulse rounded bg-muted" />
                   <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <>
              {/* Featured Post */}
              {featuredPost && (
                <div className="mb-10">
                  <BlogCard post={featuredPost} featured />
                </div>
              )}

              {/* Rest of posts */}
              {restPosts.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {restPosts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">No articles found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or category filter
              </p>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  )
}

function HeroMetric({ icon: Icon, label, value }: { icon: ElementType; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/12 p-3 ring-1 ring-white/10">
      <Icon className="mb-2 h-4 w-4 text-white/80" />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[11px] font-medium text-white/62">{label}</p>
    </div>
  )
}
