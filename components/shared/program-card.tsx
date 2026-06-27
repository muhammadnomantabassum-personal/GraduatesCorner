"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Building2, Clock, Heart, Tags, ArrowUpRight, ShieldCheck } from "lucide-react"
import type { TraineeProgram } from "@/lib/data/types"
import { useAuth } from "@/lib/auth-context"
import { useWishlist } from "@/lib/wishlist-context"

export function ProgramCard({ program }: { program: TraineeProgram }) {
  const { user } = useAuth()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const [showAllFields, setShowAllFields] = useState(false)

  const isLiked = isInWishlist(program.id, "program")

  const fields = program.field.split(",").map((f) => f.trim())
  const MAX_VISIBLE_FIELDS = 2
  const visibleFields = showAllFields ? fields : fields.slice(0, MAX_VISIBLE_FIELDS)
  const hiddenFieldCount = fields.length - MAX_VISIBLE_FIELDS

  return (
    <Card className="premium-border group relative flex min-h-[360px] flex-col overflow-hidden border-border/70 bg-card/94 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_22px_55px_rgba(66,133,244,0.14)]">
      <div className="h-1.5 w-full bg-[#fbbc05]" />
      {user?.type === "student" && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleWishlist(program.id, "program")
          }}
          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 shadow-sm border border-border/50 ${isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            }`}
        >
          <Heart className={`h-4.5 w-4.5 ${isLiked ? "fill-current" : ""}`} />
        </button>
      )}
      <CardHeader className="pb-2">
        <div className="mb-1 flex items-center justify-between gap-3">
          <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">
            Trainee Program
          </Badge>
          {program.postedBy === "admin" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold text-secondary-foreground">
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
          {program.description}
        </p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{program.company}</span>
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
