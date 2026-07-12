"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Building2, GraduationCap, BookOpen, Heart, Tags, ArrowUpRight, ShieldCheck, Gauge, Sparkles, Laptop, WalletCards, GitCompareArrows } from "lucide-react"
import type { Thesis } from "@/lib/data/types"
import { useWishlist } from "@/lib/wishlist-context"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { htmlToPlainText } from "@/lib/text"
import { getSignalToneClass, getThesisIntelligence } from "@/lib/opportunity-intelligence"
import { getWorkMode } from "@/lib/opportunity-filters"
import { useComparison } from "@/lib/comparison-context"

export function ThesisCard({ thesis }: { thesis: Thesis }) {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { isCompared, toggleComparison } = useComparison()
  const isPhD = thesis.type === "phd"
  const [showAllSubjects, setShowAllSubjects] = useState(false)

  const isLiked = isInWishlist(thesis.id, "thesis")
  const isVerified = thesis.organizationVerified || thesis.postedBy === "admin"
  const intelligence = getThesisIntelligence(thesis)
  const deadlineTone = intelligence.deadlineTone
  const deadlineLabel = intelligence.deadlineLabel
  const workMode = getWorkMode(thesis.location)
  const isInComparison = isCompared(thesis.id, "thesis")

  const subjects = thesis.subject.split(",").map((s) => s.trim())
  const MAX_VISIBLE_SUBJECTS = 2
  const visibleSubjects = showAllSubjects ? subjects : subjects.slice(0, MAX_VISIBLE_SUBJECTS)
  const hiddenSubjectCount = subjects.length - MAX_VISIBLE_SUBJECTS
  const detailHref = isPhD ? `/phd-positions/${thesis.id}` : `/theses/${thesis.id}`
  const descriptionPreview = htmlToPlainText(thesis.description)
  const comparisonItem = {
    id: thesis.id,
    kind: "thesis" as const,
    typeLabel: isPhD ? "PhD position" : "Master's thesis",
    title: thesis.title,
    organization: thesis.organization,
    field: thesis.subject,
    location: thesis.location,
    compensation: thesis.compensation,
    deadline: thesis.deadline,
    workMode,
    verified: Boolean(isVerified),
    signalScore: intelligence.score,
    href: detailHref,
  }

  return (
    <Card className={`premium-border group relative flex min-h-[410px] flex-col overflow-hidden border-border/70 bg-card/94 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_22px_55px_rgba(66,133,244,0.14)] ${isPhD ? "ring-1 ring-accent/20" : ""
      }`}>
      <div className={`h-1.5 w-full ${isPhD ? "bg-[#34a853]" : "bg-primary"}`} />
      <CardHeader className="pb-2">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Type badge */}
            <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-[5px] text-[11px] font-semibold tracking-wide ${isPhD
              ? "bg-accent/10 text-accent ring-1 ring-accent/20"
              : "bg-primary/8 text-primary ring-1 ring-primary/15"
              }`}>
              <BookOpen className="h-3 w-3" />
              {isPhD ? "PhD Position" : "Master's Thesis"}
            </span>
          </div>
          {isVerified && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#1877F2]/10 px-2 py-1 text-[10px] font-semibold text-[#1877F2] ring-1 ring-[#1877F2]/15">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          )}
        </div>

        <Link href={detailHref}>
          <h3 className="text-balance text-lg font-semibold leading-tight text-foreground transition-colors hover:text-primary">
            {thesis.title}
          </h3>
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3.5 pb-2">
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {descriptionPreview}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <QuickSignal icon={Calendar} label={deadlineLabel} tone={deadlineTone} />
          <QuickSignal icon={WalletCards} label={thesis.compensation} tone="bg-[#34A853]/10 text-[#137333] ring-1 ring-[#34A853]/15" />
          <QuickSignal icon={Laptop} label={workMode} tone="bg-[#4285F4]/10 text-[#1A73E8] ring-1 ring-[#4285F4]/15" />
          <QuickSignal
            icon={ShieldCheck}
            label={isVerified ? thesis.verificationBadge || "verified" : "unverified"}
            tone={isVerified ? "bg-[#1877F2]/10 text-[#1877F2] ring-1 ring-[#1877F2]/15" : "bg-secondary text-secondary-foreground ring-1 ring-border/60"}
          />
        </div>
        <div className="rounded-xl border border-border/70 bg-[linear-gradient(135deg,#ffffff_0%,#f6f9ff_58%,#f3fbf6_100%)] p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-primary">
              <Gauge className="h-3.5 w-3.5" />
              Opportunity signal
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-[#fbbc05]" />
              {intelligence.score}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-primary/10">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${intelligence.score}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-background px-2 py-0.5 text-[10px] font-semibold text-foreground ring-1 ring-border/70">
              {intelligence.label}
            </span>
            {intelligence.signals.slice(0, 3).map((signal) => (
              <span key={signal.label} className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getSignalToneClass(signal.tone)}`}>
                {signal.label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {thesis.organizationType === "university" ? (
              <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Building2 className="h-4 w-4 shrink-0 text-primary" />
            )}
            <span className="truncate">{thesis.organization}</span>
            {isVerified && <VerifiedBadge compact badge={thesis.verificationBadge} />}
            {thesis.postedBy === "admin" && (
              <span className="shrink-0 text-[11px] text-muted-foreground/50">- by Graduates Corner</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span>{thesis.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0 text-primary" />
            <span>Deadline: {new Date(thesis.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Tags className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="flex flex-wrap items-center gap-1.5">
              {visibleSubjects.map((s, i) => (
                <Badge key={i} variant="secondary" className="bg-primary/5 text-[10px] font-medium text-primary hover:bg-primary/10">
                  {s}
                </Badge>
              ))}
              {hiddenSubjectCount > 0 && !showAllSubjects && (
                <button
                  onClick={() => setShowAllSubjects(true)}
                  className="inline-flex items-center rounded-md bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/10 transition-all duration-200 hover:bg-primary/10 hover:ring-primary/20 active:scale-[0.96]"
                >
                  +{hiddenSubjectCount} more
                </button>
              )}
              {showAllSubjects && hiddenSubjectCount > 0 && (
                <button
                  onClick={() => setShowAllSubjects(false)}
                  className="inline-flex items-center rounded-md bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/10 transition-all duration-200 hover:bg-primary/10 hover:ring-primary/20 active:scale-[0.96]"
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto pt-0.5">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => toggleWishlist(thesis.id, "thesis")}
              aria-label={isLiked ? "Remove from wishlist" : "Save to wishlist"}
              aria-pressed={isLiked}
              title={isLiked ? "Remove from wishlist" : "Save to wishlist"}
              className={`flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background transition-all hover:-translate-y-0.5 hover:border-[#ea4335]/35 ${isLiked ? "text-[#ea4335]" : "text-muted-foreground hover:text-[#ea4335]"}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => toggleComparison(comparisonItem)}
              aria-label={isInComparison ? "Remove from comparison" : "Add to comparison"}
              aria-pressed={isInComparison}
              title={isInComparison ? "Remove from comparison" : "Add to comparison"}
              className={`flex h-9 w-9 items-center justify-center rounded-md border transition-all hover:-translate-y-0.5 ${isInComparison ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/35 hover:text-primary"}`}
            >
              <GitCompareArrows className="h-4 w-4" />
            </button>
          </div>
          <Link
            href={detailHref}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.97]"
          >
            View details
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

function QuickSignal({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof Calendar
  label: string
  tone: string
}) {
  return (
    <div className={`flex min-h-9 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-bold capitalize ${tone}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  )
}
