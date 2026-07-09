"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Building2, Clock, Heart, Tags, ArrowUpRight, ShieldCheck, Gauge, Sparkles, Laptop, WalletCards } from "lucide-react"
import type { TraineeProgram } from "@/lib/data/types"
import { useWishlist } from "@/lib/wishlist-context"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { htmlToPlainText } from "@/lib/text"
import { getProgramIntelligence, getSignalToneClass } from "@/lib/opportunity-intelligence"
import { getWorkMode } from "@/lib/opportunity-filters"

export function ProgramCard({ program }: { program: TraineeProgram }) {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const [showAllFields, setShowAllFields] = useState(false)

  const isLiked = isInWishlist(program.id, "program")
  const isVerified = program.organizationVerified || program.postedBy === "admin"
  const intelligence = getProgramIntelligence(program)
  const deadlineTone = intelligence.deadlineTone
  const deadlineLabel = intelligence.deadlineLabel
  const workMode = getWorkMode(program.location)

  const fields = program.field.split(",").map((f) => f.trim())
  const MAX_VISIBLE_FIELDS = 2
  const visibleFields = showAllFields ? fields : fields.slice(0, MAX_VISIBLE_FIELDS)
  const hiddenFieldCount = fields.length - MAX_VISIBLE_FIELDS
  const descriptionPreview = htmlToPlainText(program.description)

  return (
    <Card className="premium-border group relative flex min-h-[410px] flex-col overflow-hidden border-border/70 bg-card/94 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_22px_55px_rgba(66,133,244,0.14)]">
      <div className="h-1.5 w-full bg-[#fbbc05]" />
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleWishlist(program.id, "program")
        }}
        aria-label={isLiked ? "Remove from wishlist" : "Save to wishlist"}
        title={isLiked ? "Remove from wishlist" : "Save to wishlist"}
        className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:scale-110 active:scale-95 ${isLiked ? "text-[#ea4335]" : "text-muted-foreground hover:text-[#ea4335]"
          }`}
      >
        <Heart className={`h-4.5 w-4.5 ${isLiked ? "fill-current" : ""}`} />
      </button>
      <CardHeader className="pb-2">
        <div className="mb-1 flex items-center justify-between gap-3">
          <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">
            Trainee Program
          </Badge>
          {isVerified && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#1877F2]/10 px-2 py-1 text-[10px] font-semibold text-[#1877F2] ring-1 ring-[#1877F2]/15">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          )}
        </div>
        <Link href={`/trainee-programs/${program.id}`}>
          <h3 className="text-balance text-lg font-semibold leading-tight text-foreground transition-colors hover:text-primary">
            {program.title}
          </h3>
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3.5 pb-2">
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {descriptionPreview}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <QuickSignal icon={Calendar} label={deadlineLabel} tone={deadlineTone} />
          <QuickSignal icon={WalletCards} label={program.compensation} tone="bg-[#34A853]/10 text-[#137333] ring-1 ring-[#34A853]/15" />
          <QuickSignal icon={Laptop} label={workMode} tone="bg-[#4285F4]/10 text-[#1A73E8] ring-1 ring-[#4285F4]/15" />
          <QuickSignal
            icon={ShieldCheck}
            label={isVerified ? program.verificationBadge || "verified" : "unverified"}
            tone={isVerified ? "bg-[#1877F2]/10 text-[#1877F2] ring-1 ring-[#1877F2]/15" : "bg-secondary text-secondary-foreground ring-1 ring-border/60"}
          />
        </div>
        <div className="rounded-xl border border-border/70 bg-[linear-gradient(135deg,#ffffff_0%,#fffaf0_48%,#f6f9ff_100%)] p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-primary">
              <Gauge className="h-3.5 w-3.5" />
              Smart fit
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
            <Building2 className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{program.company}</span>
            {isVerified && <VerifiedBadge compact badge={program.verificationBadge} />}
            {program.postedBy === "admin" && (
              <span className="shrink-0 text-[11px] text-muted-foreground/50">- by Graduates Corner</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span>{program.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <span>{program.duration}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0 text-primary" />
            <span>Deadline: {new Date(program.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Tags className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="flex flex-wrap items-center gap-1.5">
              {visibleFields.map((f, i) => (
                <Badge key={i} variant="secondary" className="bg-primary/5 text-[10px] font-medium text-primary hover:bg-primary/10">
                  {f}
                </Badge>
              ))}
              {hiddenFieldCount > 0 && !showAllFields && (
                <button
                  onClick={() => setShowAllFields(true)}
                  className="inline-flex items-center rounded-md bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/10 transition-all duration-200 hover:bg-primary/10 hover:ring-primary/20 active:scale-[0.96]"
                >
                  +{hiddenFieldCount} more
                </button>
              )}
              {showAllFields && hiddenFieldCount > 0 && (
                <button
                  onClick={() => setShowAllFields(false)}
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
        <div className="flex w-full justify-between gap-3">
          <span className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold capitalize text-secondary-foreground">
            {program.compensation}
          </span>
          <Link
            href={`/trainee-programs/${program.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-primary transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:shadow-accent/25 active:scale-[0.97]"
          >
            View Details
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
