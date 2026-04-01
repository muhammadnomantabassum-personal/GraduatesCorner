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
} from "lucide-react"
import { theses } from "@/lib/data/theses"
import { traineePrograms } from "@/lib/data/trainee-programs"
import { blogPosts } from "@/lib/data/blog-posts"

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
  const router = useRouter()

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

  const approvedTheses = theses.filter((t) => t.status === "approved").slice(0, 5)
  const approvedPrograms = traineePrograms
    .filter((p) => p.status === "approved")
    .slice(0, 5)
  const recentPosts = blogPosts.filter((p) => p.status === "approved").slice(0, 5)

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
        title="Search GraduatesCorner"
        description="Search for pages, theses, programs, and blog posts"
      >
        <CommandInput placeholder="Type to search everything..." />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <Search className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No results found.</p>
              <p className="text-xs text-muted-foreground/60">
                Try searching for a thesis, program, or page.
              </p>
            </div>
          </CommandEmpty>

          {/* Pages */}
          <CommandGroup heading="Pages">
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
          <CommandGroup heading="Theses">
            {approvedTheses.map((thesis) => (
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
                    {thesis.organization} · {thesis.type.toUpperCase()} · {thesis.subject}
                  </span>
                </div>
              </CommandItem>
            ))}
            <CommandItem
              value="View all opportunities"
              onSelect={() => runCommand(() => router.push("/master-thesis"))}
              className="gap-3 text-primary"
            >
              <ArrowRight className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">View all opportunities</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Trainee Programs */}
          <CommandGroup heading="Trainee Programs">
            {approvedPrograms.map((program) => (
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
            <CommandItem
              value="View all trainee programs"
              onSelect={() =>
                runCommand(() => router.push("/trainee-programs"))
              }
              className="gap-3 text-primary"
            >
              <ArrowRight className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">
                View all trainee programs
              </span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Blog */}
          <CommandGroup heading="Blog Posts">
            {recentPosts.map((post) => (
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
            <CommandItem
              value="View all blog posts"
              onSelect={() => runCommand(() => router.push("/blog"))}
              className="gap-3 text-primary"
            >
              <ArrowRight className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">View all blog posts</span>
            </CommandItem>
          </CommandGroup>
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
