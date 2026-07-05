"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Heart,
  Newspaper,
  Rocket,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type AssistantSurface = "public" | "dashboard" | "admin"
type GoalKey = "phd" | "thesis" | "trainee" | "blog"

const goals: Record<GoalKey, { label: string; href: string; icon: typeof GraduationCap }> = {
  phd: { label: "Find PhD", href: "/phd-positions", icon: GraduationCap },
  thesis: { label: "Find Thesis", href: "/master-thesis", icon: BookOpen },
  trainee: { label: "Trainee Program", href: "/trainee-programs", icon: Briefcase },
  blog: { label: "Read Blog", href: "/blog", icon: Newspaper },
}

const publicActions = [
  { label: "Master Thesis", href: "/master-thesis", icon: BookOpen },
  { label: "PhD Positions", href: "/phd-positions", icon: GraduationCap },
  { label: "Trainee Programs", href: "/trainee-programs", icon: Briefcase },
  { label: "Contact", href: "/contact", icon: UsersRound },
]

const dashboardActions = [
  { label: "Wishlist", href: "/dashboard/student/wishlist", icon: Heart },
  { label: "Deadline Calendar", href: "/dashboard/student/calendar", icon: CalendarClock },
  { label: "Applied Posts", href: "/dashboard/student/applied", icon: ClipboardList },
  { label: "Write Blog", href: "/dashboard/student/blogs/new", icon: Newspaper },
]

const adminActions = [
  { label: "Users", href: "/n_admin/dashboard/users", icon: UsersRound },
  { label: "PhD Queue", href: "/n_admin/dashboard/phd-positions", icon: GraduationCap },
  { label: "External Imports", href: "/n_admin/dashboard/imports", icon: Rocket },
  { label: "Write Blog", href: "/n_admin/dashboard/blogs/new", icon: Newspaper },
]

const checklist = [
  "Save strong opportunities",
  "Check nearest deadline",
  "Compare funding and location",
  "Prepare application link",
]

function getContextCopy(pathname: string, surface: AssistantSurface) {
  if (surface === "admin") return "Platform management, moderation, and publishing controls."
  if (surface === "dashboard") return "Personal workspace for saved posts, deadlines, blogs, and applications."
  if (pathname.includes("phd")) return "Doctoral opportunities with deadlines, verified organizations, and direct application links."
  if (pathname.includes("master-thesis") || pathname.includes("theses")) return "Research projects for thesis discovery, shortlisting, and application planning."
  if (pathname.includes("trainee")) return "Graduate programs for early-career paths, durations, locations, and compensation."
  if (pathname.includes("blog")) return "Editorial guidance, career intelligence, and academic application insight."
  return "Academic opportunity discovery for students, universities, and companies."
}

export function OpportunityAssistant({ surface = "public" }: { surface?: AssistantSurface }) {
  const pathname = usePathname()
  const [goal, setGoal] = useState<GoalKey>("phd")
  const [region, setRegion] = useState("Sweden")
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem("gc_assistant_state")
    if (!saved) return

    try {
      const parsed = JSON.parse(saved) as {
        goal?: GoalKey
        region?: string
        done?: Record<string, boolean>
      }
      if (parsed.goal && parsed.goal in goals) setGoal(parsed.goal)
      if (parsed.region) setRegion(parsed.region)
      if (parsed.done) setDone(parsed.done)
    } catch {
      // Keep defaults if local storage was manually changed.
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem("gc_assistant_state", JSON.stringify({ goal, region, done }))
  }, [done, goal, region])

  const selectedGoal = goals[goal]
  const readiness = Math.round((Object.values(done).filter(Boolean).length / checklist.length) * 100)
  const actions = surface === "admin" ? adminActions : surface === "dashboard" ? dashboardActions : publicActions
  const contextCopy = getContextCopy(pathname, surface)
  const smartPath = useMemo(() => {
    if (surface === "admin") return "/n_admin/dashboard"
    if (surface === "dashboard") return "/dashboard/student/calendar"
    return `${selectedGoal.href}${region ? `?region=${encodeURIComponent(region)}` : ""}`
  }, [region, selectedGoal.href, surface])

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "https://graduatescorner.com"
    if (navigator.share) {
      await navigator.share({ title: "Graduates Corner", url })
      return
    }

    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-5 right-5 z-[60] h-12 rounded-full border border-white/50 bg-[#202124] px-4 text-white shadow-[0_20px_60px_rgba(32,33,36,0.26)] hover:bg-[#303134]"
          aria-label="Open opportunity assistant"
        >
          <Sparkles className="h-4 w-4 text-[#FBBC05]" />
          <span className="hidden sm:inline">Assistant</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[min(100vw,30rem)] overflow-y-auto border-l border-border/70 bg-background/96 p-0 backdrop-blur-xl sm:max-w-md">
        <SheetHeader className="border-b border-border/70 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Smart layer</Badge>
            <Badge variant="outline">{surface === "admin" ? "Admin" : surface === "dashboard" ? "Workspace" : "Public"}</Badge>
          </div>
          <SheetTitle className="text-xl">Opportunity Assistant</SheetTitle>
          <SheetDescription>{contextCopy}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-5">
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Smart pathway</p>
                <p className="text-xs text-muted-foreground">{selectedGoal.label} near {region}</p>
              </div>
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(goals) as GoalKey[]).map((key) => {
                const Icon = goals[key].icon
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setGoal(key)}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs font-semibold transition-all ${
                      goal === key
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {goals[key].label}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["Sweden", "Europe", "Remote"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRegion(item)}
                  className={`rounded-md border px-2 py-2 text-xs font-semibold transition-colors ${
                    region === item
                      ? "border-accent bg-accent/15 text-accent-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <Button asChild className="mt-3 w-full gap-2">
              <Link href={smartPath}>
                <Rocket className="h-4 w-4" />
                Open Pathway
              </Link>
            </Button>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Readiness</p>
              <span className="text-xs font-semibold text-primary">{readiness}%</span>
            </div>
            <Progress value={readiness} className="mb-3 h-2" />
            <div className="space-y-2">
              {checklist.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDone((current) => ({ ...current, [item]: !current[item] }))}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <CheckCircle2 className={`h-4 w-4 ${done[item] ? "text-accent" : "text-muted-foreground/40"}`} />
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">Quick actions</p>
            <div className="grid gap-2">
              {actions.map((action) => (
                <Button key={action.href} asChild variant="outline" className="justify-start gap-2">
                  <Link href={action.href}>
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Link>
                </Button>
              ))}
            </div>
            <Button type="button" variant="ghost" className="mt-2 w-full gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              {copied ? "Link copied" : "Share current page"}
            </Button>
          </section>

          <section className="rounded-lg border border-primary/20 bg-primary/[0.04] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Verified badges, deadline tracking, wishlist actions, and admin moderation work together to keep discovery organized and trustworthy.
              </p>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
