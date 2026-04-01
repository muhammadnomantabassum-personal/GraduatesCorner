"use client"

import { useState, useMemo, useEffect } from "react"
import { PublicLayout } from "@/components/layout/public-layout"
import { BlogCard } from "@/components/shared/blog-card"
import { useAuth } from "@/lib/auth-context"
import type { BlogPost } from "@/lib/data/types"
import { Search, X, Loader2 } from "lucide-react"

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
        .select('id, title, slug, excerpt, author, category, cover_image, created_at, read_time, status, posted_by_user_id')
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

  return (
    <PublicLayout>
      <section className="border-b border-border bg-primary px-4 py-12 text-primary-foreground lg:py-16">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-3 text-3xl font-bold lg:text-4xl">Blog</h1>
          <p className="mb-6 text-lg text-primary-foreground/80">
            Career tips, academic insights, industry news, and success stories
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2.5">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          {/* Category Tabs */}
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card p-4">
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
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
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
