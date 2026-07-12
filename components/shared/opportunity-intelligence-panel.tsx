"use client"

import Link from "next/link"
import {
  BookOpen,
  Briefcase,
  Building2,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Sparkles,
  WalletCards,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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

const tracks: Array<{ id: TrackId; label: string; href: string; icon: LucideIcon }> = [
  { id: "phd", label: "PhD", href: "/phd-positions", icon: GraduationCap },
  { id: "thesis", label: "Thesis", href: "/master-thesis", icon: BookOpen },
  { id: "trainee", label: "Trainee", href: "/trainee-programs", icon: Briefcase },
]

export function OpportunityIntelligencePanel({
  compact = false,
  className,
  defaultTrack = "phd",
  totals = {},
}: OpportunityIntelligencePanelProps) {
  const total = totals.total || 0
  const funded = totals.funded || 0
  const verified = totals.verified || 0
  const fundedRate = total > 0 ? Math.round((funded / total) * 100) : 0
  const verifiedRate = total > 0 ? Math.round((verified / total) * 100) : 0
  const activeTrack = tracks.find((track) => track.id === defaultTrack) || tracks[0]

  const metrics = [
    { label: "Matching results", value: total, icon: Sparkles, tone: "text-[#4285f4]" },
    { label: "Funded", value: funded, icon: WalletCards, tone: "text-[#34a853]" },
    { label: "Verified", value: verified, icon: ShieldCheck, tone: "text-[#1877f2]" },
    { label: "Locations", value: totals.locations || 0, icon: MapPin, tone: "text-[#ea4335]" },
  ]

  return (
    <section className={cn("border-y border-border/60 bg-card/72 px-4", compact ? "py-6" : "py-10", className)}>
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <Badge variant="outline" className="mb-4 gap-2 bg-background/75">
              <activeTrack.icon className="h-3.5 w-3.5 text-primary" />
              Live decision snapshot
            </Badge>
            <h2 className={cn("text-balance font-bold text-foreground", compact ? "text-2xl" : "text-3xl lg:text-4xl")}>
              See the market before you open every listing.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Funding, verification, organization, and location coverage are calculated from the opportunities currently in view.
            </p>

            <nav className="mt-5 inline-flex rounded-md border border-border bg-background p-1" aria-label="Opportunity categories">
              {tracks.map((track) => {
                const Icon = track.icon
                const active = track.id === activeTrack.id
                return (
                  <Link
                    key={track.id}
                    href={track.href}
                    className={cn(
                      "inline-flex min-h-9 items-center gap-2 rounded-sm px-3 text-xs font-semibold transition-colors",
                      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {track.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div>
            <div className="grid grid-cols-2 border border-border bg-background sm:grid-cols-4">
              {metrics.map((metric, index) => (
                <div
                  key={metric.label}
                  className={cn(
                    "min-h-28 p-4",
                    index % 2 === 0 && "border-r border-border",
                    index < 2 && "border-b border-border sm:border-b-0",
                    index > 0 && "sm:border-l sm:border-border",
                    index === 2 && "border-r border-border sm:border-r-0"
                  )}
                >
                  <metric.icon className={cn("mb-3 h-4 w-4", metric.tone)} />
                  <p className="text-2xl font-bold tabular-nums text-foreground">{metric.value}</p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{metric.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <CoverageBar label="Funding coverage" value={fundedRate} icon={WalletCards} />
              <CoverageBar label="Verified coverage" value={verifiedRate} icon={ShieldCheck} />
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              {totals.organizations || 0} organizations across {totals.locations || 0} locations
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function CoverageBar({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          <Icon className="h-3.5 w-3.5 text-primary" />
          {label}
        </span>
        <span className="font-bold tabular-nums text-primary">{value}%</span>
      </div>
      <Progress value={value} className="h-2 bg-primary/10" />
    </div>
  )
}
