"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Home,
  BookOpen,
  Briefcase,
  Newspaper,
  MessageSquare,
  Info,
  FileText,
  GraduationCap,
  Search,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Thesis, TraineeProgram, BlogPost } from "@/lib/data/types"

const pages = [
  { name: "Home", href: "/", icon: Home },
  { name: "Master's Theses", href: "/master-thesis", icon: BookOpen },
  { name: "PhD Positions", href: "/phd-positions", icon: GraduationCap },
  { name: "Trainee Programs", href: "/trainee-programs", icon: Briefcase },
  { name: "Blog", href: "/blog", icon: Newspaper },
  { name: "Testimonials", href: "/testimonials", icon: MessageSquare },
  { name: "About", href: "/about", icon: Info },
  { name: "Log In", href: "/login", icon: ArrowRight },
  { name: "Register", href: "/register", icon: GraduationCap },
]

export function GlobalSearchCommand() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [items, setItems] = useState<{
    masterTheses: Partial<Thesis>[],
    phdPositions: Partial<Thesis>[],
    programs: Partial<TraineeProgram>[],
    posts: Partial<BlogPost>[],
    searchResults: any[]
  }>({
    masterTheses: [],
    phdPositions: [],
    programs: [],
    posts: [],
    searchResults: []
  })
  const router = useRouter()
  const supabase = createClient()

  const fetchRecentItems = useCallback(async () => {
    setLoading(true)
    try {
      const [
        { data: masterData },
        { data: phdData },
        { data: progData },
        { data: postsData }
      ] = await Promise.all([
        supabase.from('theses').select('id, title, type, subject, organization').eq('status', 'approved').eq('type', 'master').limit(5),
        supabase.from('theses').select('id, title, type, subject, organization').eq('status', 'approved').eq('type', 'phd').limit(5),
        supabase.from('trainee_programs').select('id, title, company, field, location').eq('status', 'approved').limit(5),
        supabase.from('blog_posts').select('id, title, slug, author, category, read_time').eq('status', 'approved').order('created_at', { ascending: false }).limit(5)
      ])

      setItems(prev => ({
        ...prev,
        masterTheses: masterData || [],
        phdPositions: phdData || [],
        programs: progData || [],
        posts: (postsData || []).map((p: any) => ({
          ...p,
          readTime: p.read_time // mapping snake_case to camelCase
        }))
      }))
    } catch (error) {
      console.error("Failed to fetch search items:", error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (open && items.masterTheses.length === 0) {
      fetchRecentItems()
    }
  }, [open, items.masterTheses.length, fetchRecentItems])

  // Live Search Effect
  useEffect(() => {
    if (searchQuery.length < 2) {
      setItems(prev => ({ ...prev, searchResults: [] }))
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()
        setItems(prev => ({ ...prev, searchResults: data.results || [] }))
      } catch (error) {
        console.error("Global search failed:", error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false)
      command()
    },
    []
  )



  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="group flex h-8 items-center gap-2 rounded-lg border border-border/60 bg-secondary/50 px-2.5 text-[13px] text-muted-foreground transition-all duration-200 hover:border-border hover:bg-secondary hover:text-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="pointer-events-none hidden select-none items-center gap-0.5 rounded border border-border/80 bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-[11px]">⌘</span>K
        </kbd>
      </button>

      {/* Command Palette Dialog */}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Graduates Corner"
        description="Search for pages, theses, programs, and blog posts"
      >
        <CommandInput 
          placeholder="Type to search everything..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList className="max-h-[400px]">
          {loading && items.searchResults.length === 0 && (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <Search className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No results found.</p>
              <p className="text-xs text-muted-foreground/60">
                Try searching for a thesis, program, or topic.
              </p>
            </div>
          </CommandEmpty>

          {/* Live Search Results */}
          {items.searchResults.length > 0 && (
            <CommandGroup heading="Search Results">
              {items.searchResults.map((result) => (
                <CommandItem
                  key={`${result.category}-${result.id}`}
                  value={`${result.title} ${result.meta} ${result.category}`}
                  onSelect={() => runCommand(() => {
                    const link = result.category === 'thesis' ? `/theses/${result.id}` :
                                 result.category === 'program' ? `/trainee-programs/${result.id}` :
                                 `/blog/${result.slug || result.id}`;
                    router.push(link);
                  })}
                  className="gap-3"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    result.category === 'thesis' || result.category === 'phd' ? 'bg-primary/10 text-primary' :
                    result.category === 'program' ? 'bg-accent/10 text-accent' :
                    'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {result.category === 'phd' || (result.category === 'thesis' && result.meta?.toLowerCase().includes('phd')) ? (
                      <GraduationCap className="h-4 w-4" />
                    ) : result.category === 'thesis' ? (
                      <FileText className="h-4 w-4" />
                    ) : result.category === 'program' ? (
                      <Briefcase className="h-4 w-4" />
                    ) : (
                      <Newspaper className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="truncate text-sm font-medium">{result.title}</span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      <span className="capitalize">{result.category}</span> · {result.meta}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!searchQuery && (
            <>
              {/* Pages */}
              <CommandGroup heading="Quick Access">
                {pages.map((page) => (
                  <CommandItem
                    key={page.href}
                    value={page.name}
                    onSelect={() => runCommand(() => router.push(page.href))}
                    className="gap-3"
                  >
                    <page.icon className="h-4 w-4 text-foreground/60" />
                    <span>{page.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              {/* Theses */}
              {items.masterTheses.length > 0 && (
                <CommandGroup heading="Recent Master Theses">
                  {items.masterTheses.map((thesis) => (
                    <CommandItem
                      key={thesis.id}
                      value={`${thesis.title} ${thesis.subject} ${thesis.organization}`}
                      onSelect={() =>
                        runCommand(() => router.push(`/theses/${thesis.id}`))
                      }
                      className="gap-3"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-foreground/60" />
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="truncate text-sm">{thesis.title}</span>
                        <span className="truncate text-xs text-foreground/60">
                          {thesis.organization} · {thesis.subject}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandSeparator />

              {/* PhD Positions */}
              {items.phdPositions.length > 0 && (
                <CommandGroup heading="Recent PhD Positions">
                  {items.phdPositions.map((phd) => (
                    <CommandItem
                      key={phd.id}
                      value={`${phd.title} ${phd.subject} ${phd.organization}`}
                      onSelect={() =>
                        runCommand(() => router.push(`/theses/${phd.id}`))
                      }
                      className="gap-3"
                    >
                      <GraduationCap className="h-4 w-4 shrink-0 text-foreground/60" />
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="truncate text-sm">{phd.title}</span>
                        <span className="truncate text-xs text-foreground/60">
                          {phd.organization} · {phd.subject}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandSeparator />

              {/* Trainee Programs */}
              {items.programs.length > 0 && (
                <CommandGroup heading="Recent Programs">
                  {items.programs.map((program) => (
                    <CommandItem
                      key={program.id}
                      value={`${program.title} ${program.company} ${program.field}`}
                      onSelect={() =>
                        runCommand(() =>
                          router.push(`/trainee-programs/${program.id}`)
                        )
                      }
                      className="gap-3"
                    >
                      <Briefcase className="h-4 w-4 shrink-0 text-foreground/60" />
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="truncate text-sm">{program.title}</span>
                        <span className="truncate text-xs text-foreground/60">
                          {program.company} · {program.field} · {program.location}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandSeparator />

              {/* Blog */}
              {items.posts.length > 0 && (
                <CommandGroup heading="Recent Blog Posts">
                  {items.posts.map((post) => (
                    <CommandItem
                      key={post.id}
                      value={`${post.title} ${post.category} ${post.author}`}
                      onSelect={() =>
                        runCommand(() => router.push(`/blog/${post.slug}`))
                      }
                      className="gap-3"
                    >
                      <Newspaper className="h-4 w-4 shrink-0 text-foreground/60" />
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="truncate text-sm">{post.title}</span>
                        <span className="truncate text-xs text-foreground/60">
                          {post.author} · {post.category} · {post.readTime}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[10px]">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[10px]">esc</kbd>
              close
            </span>
          </div>
        </div>
      </CommandDialog>
    </>
  )
}
