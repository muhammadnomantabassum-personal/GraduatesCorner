"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Building2, GraduationCap, BookOpen, Heart, Tags } from "lucide-react"
import type { Thesis } from "@/lib/data/types"
import { useAuth } from "@/lib/auth-context"
import { useWishlist } from "@/lib/wishlist-context"

export function ThesisCard({ thesis }: { thesis: Thesis }) {
  const { user } = useAuth()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const isPhD = thesis.type === "phd"
  const [showAllSubjects, setShowAllSubjects] = useState(false)

  const isLiked = isInWishlist(thesis.id, "thesis")

  const subjects = thesis.subject.split(",").map((s) => s.trim())
  const MAX_VISIBLE_SUBJECTS = 2
  const visibleSubjects = showAllSubjects ? subjects : subjects.slice(0, MAX_VISIBLE_SUBJECTS)
  const hiddenSubjectCount = subjects.length - MAX_VISIBLE_SUBJECTS

  return (
    <Card className={`group relative flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isPhD ? "ring-1 ring-accent/15" : ""
      }`}>
      {user?.type === "student" && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleWishlist(thesis.id, "thesis")
          }}
          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 shadow-sm border border-border/50 ${isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            }`}
        >
          <Heart className={`h-4.5 w-4.5 ${isLiked ? "fill-current" : ""}`} />
        </button>
      )}
      <CardHeader className="pb-2">
        <div className="mb-1 flex items-center justify-between">
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
        </div>

        <Link href={`/theses/${thesis.id}`}>
          <h3 className="text-balance text-lg font-semibold leading-tight text-foreground transition-colors hover:text-primary">
            {thesis.title}
          </h3>
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3.5 pb-2">
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {thesis.description}
        </p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {thesis.organizationType === "university" ? (
              <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Building2 className="h-4 w-4 shrink-0 text-primary" />
            )}
            <span className="truncate">{thesis.organization}</span>
            {thesis.postedBy === "admin" && (
              <span className="shrink-0 text-[11px] text-muted-foreground/50">· by GradNexus</span>
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
        <div className="flex w-full justify-end">
          <Link
            href={`/theses/${thesis.id}`}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-primary transition-all duration-200 hover:bg-accent hover:text-white hover:shadow-md hover:shadow-accent/25 active:scale-[0.97]"
          >
            View Details
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
