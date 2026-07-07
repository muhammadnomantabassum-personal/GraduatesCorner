"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  BrainCircuit,
  Briefcase,
  Building2,
  CheckCircle2,
  Compass,
  GraduationCap,
  Heart,
  LineChart,
  MapPin,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type TrackId = "phd" | "thesis" | "trainee"

interface OpportunityTotals {
  total?: number
  funded?: number
  verified?: number
  locations?: number
  organizations?: number
}

interface OpportunityIntelligencePanelProps {
  compact?: boolean
  className?: string
  defaultTrack?: TrackId
  totals?: OpportunityTotals
}

const tracks: Array<{
  id: TrackId
  label: string
  href: string
  icon: LucideIcon
  accent: string
  line: string
}> = [
  {
    id: "phd",
    label: "PhD",
    href: "/phd-positions",
    icon: GraduationCap,
    accent: "bg-[#34a853] text-white",
    line: "Research-focused path with funding, supervisor fit, and deadline timing.",
  },
  {
    id: "thesis",
    label: "Thesis",
    href: "/master-thesis",
    icon: BookOpen,
    accent: "bg-[#4285f4] text-white",
    line: "Academic-industry projects matched by field, organization, and location.",
  },
  {
    id: "trainee",
    label: "Trainee",
    href: "/trainee-programs",
    icon: Briefcase,
    accent: "bg-[#fbbc05] text-[#202124]",
    line: "Career pipelines compared by company, duration, field, and compensation.",
  },
]

const fields = ["AI/Data", "Engineering", "Life Science", "Sustainability", "Business"]
const regions = ["Sweden", "Europe", "Remote", "Global"]
const fundingModes = ["Paid", "Stipend", "Flexible"]

const intelligenceCards = [
  {
    title: "Deadline radar",
    copy: "Prioritizes opportunities with the strongest timing window.",
    icon: Timer,
    tone: "text-[#fbbc05]",
  },
  {
    title: "Verified sources",
    copy: "Highlights universities and companies with admin-approved trust badges.",
    icon: ShieldCheck,
    tone: "text-[#4285f4]",
  },
  {
    title: "Action queue",
    copy: "Turns saved roles into a clear shortlist for the next application step.",
    icon: CheckCircle2,
    tone: "text-[#34a853]",
  },
]

export function OpportunityIntelligencePanel({
  compact = false,
  className,
  defaultTrack = "phd",
  totals,
}: OpportunityIntelligencePanelProps) {
  const [trackId, setTrackId] = useState<TrackId>(defaultTrack)
  const [field, setField] = useState(fields[0])
  const [region, setRegion] = useState(regions[0])
  const [funding, setFunding] = useState(fundingModes[0])

  const activeTrack = tracks.find((track) => track.id === trackId) || tracks[0]

  const score = useMemo(() => {
    let value = 64
    if (trackId === "phd") value += 6
    if (field === "AI/Data" || field === "Engineering") value += 7
    if (region === "Europe" || region === "Remote") value += 5
    if (funding === "Paid" || funding === "Stipend") value += 9
    if ((totals?.verified || 0) > 0) value += 4
    if ((totals?.funded || 0) > 0) value += 3
    return Math.min(value, 97)
  }, [field, funding, region, totals?.funded, totals?.verified, trackId])

  const ActiveTrackIcon = activeTrack.icon
  const marketDepth = Math.min(96, 58 + Math.min(totals?.total || 0, 50))
  const trustDepth = totals?.total ? Math.round(((totals.verified || 0) / totals.total) * 100) : 82
  const fundedDepth = totals?.total ? Math.round(((totals.funded || 0) / totals.total) * 100) : 76

  const metrics = [
    { label: "Pathway fit", value: score, icon: Target },
    { label: "Market depth", value: marketDepth || 74, icon: LineChart },
    { label: "Trust signal", value: Math.max(trustDepth, totals?.verified ? 18 : 76), icon: ShieldCheck },
    { label: "Funding signal", value: Math.max(fundedDepth, totals?.funded ? 18 : 70), icon: Zap },
  ]

  return (
    <section className={cn("px-4 py-14", compact && "py-6", className)}>
      <div className="mx-auto max-w-7xl">
        <div
          className={cn(
            "premium-border overflow-hidden rounded-2xl border border-border/70 bg-card/92 shadow-[0_24px_80px_rgba(66,133,244,0.13)] backdrop-blur",
            compact ? "p-4 lg:p-5" : "p-5 lg:p-8"
          )}
        >
          <div className={cn("grid gap-6", compact ? "lg:grid-cols-[0.9fr_1.1fr]" : "lg:grid-cols-[0.82fr_1.18fr]")}>
            <div className="flex flex-col justify-between gap-6">
              <div>
                <Badge variant="outline" className="mb-4 gap-2 bg-background/70">
                  <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                  Opportunity Intelligence
                </Badge>
                <h2 className={cn("text-balance font-bold text-foreground", compact ? "text-2xl" : "text-3xl lg:text-4xl")}>
                  A sharper way to choose your next academic or career move.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground lg:text-base">
                  Smart pathways, deadline context, trust signals, and funding cues work together so every search feels focused and professional.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="flex flex-wrap gap-2">
                  {tracks.map((track) => {
                    const Icon = track.icon
                    const selected = track.id === trackId
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => setTrackId(track.id)}
                        className={cn(
                          "inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-all",
                          selected
                            ? "border-primary/35 bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-background/80 text-muted-foreground hover:border-primary/25 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {track.label}
                      </button>
                    )
                  })}
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <ChoiceGroup label="Field" options={fields} value={field} onChange={setField} />
                  <ChoiceGroup label="Region" options={regions} value={region} onChange={setRegion} />
                  <ChoiceGroup label="Funding" options={fundingModes} value={funding} onChange={setFunding} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-2xl border border-border/70 bg-[linear-gradient(135deg,#ffffff_0%,#f6f9ff_46%,#f1f8f4_100%)] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-primary">Recommended pathway</p>
                    <h3 className="mt-1 text-2xl font-bold text-foreground">{activeTrack.label} discovery</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{activeTrack.line}</p>
                  </div>
                  <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", activeTrack.accent)}>
                    <ActiveTrackIcon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-border/70 bg-card/85 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Sparkles className="h-4 w-4 text-[#fbbc05]" />
                      Intelligent readiness
                    </span>
                    <span className="text-2xl font-bold text-primary">{score}%</span>
                  </div>
                  <Progress value={score} className="h-2.5 bg-primary/12" />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <SignalPill icon={Compass} label={region} />
                    <SignalPill icon={Wand2} label={field} />
                    <SignalPill icon={Rocket} label={funding} />
                    <SignalPill icon={Heart} label="Wishlist-ready" />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={activeTrack.href}>
                    <Button className="gap-2 rounded-xl">
                      Explore pathway
                      <Rocket className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/dashboard/student/wishlist">
                    <Button variant="outline" className="gap-2 rounded-xl bg-white/80">
                      Saved list
                      <Heart className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  {(totals?.total || totals?.organizations || totals?.locations || totals?.funded) ? (
                    <>
                      <MiniStat icon={Target} label="Results" value={totals?.total || 0} />
                      <MiniStat icon={Building2} label="Organizations" value={totals?.organizations || 0} />
                      <MiniStat icon={MapPin} label="Locations" value={totals?.locations || 0} />
                      <MiniStat icon={ShieldCheck} label="Verified" value={totals?.verified || 0} />
                    </>
                  ) : (
                    intelligenceCards.map((card) => (
                      <InsightCard key={card.title} {...card} />
                    ))
                  )}
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Live decision signals</span>
                    <Badge variant="secondary" className="gap-1">
                      <LineChart className="h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {metrics.map((metric) => (
                      <div key={metric.label}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <metric.icon className="h-3.5 w-3.5 text-primary" />
                            {metric.label}
                          </span>
                          <span className="font-semibold text-foreground">{metric.value}%</span>
                        </div>
                        <Progress value={metric.value} className="h-2 bg-primary/10" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/75 p-2">
      <p className="px-1 pb-1 text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <div className="flex gap-1 overflow-x-auto scrollbar-none sm:flex-col">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition-all",
              value === option ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function SignalPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border/70 bg-white/80 px-2.5 text-xs font-semibold text-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span className="truncate">{label}</span>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/75 p-3">
      <Icon className="mb-2 h-4 w-4 text-primary" />
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
    </div>
  )
}

function InsightCard({ icon: Icon, title, copy, tone }: { icon: LucideIcon; title: string; copy: string; tone: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/75 p-3">
      <Icon className={cn("mb-2 h-4 w-4", tone)} />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy}</p>
    </div>
  )
}
