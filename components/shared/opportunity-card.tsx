"use client"
import Link from "next/link"
import { useState } from "react"
import { ArrowUpRight, Bookmark, Check, GitCompareArrows, MapPin, CalendarDays } from "lucide-react"
import { useWishlist } from "@/lib/wishlist-context"
import { useComparison, type ComparisonItem } from "@/lib/comparison-context"
import { htmlToPlainText } from "@/lib/text"

export function OpportunityCard({ item, description, sourceLabel }: { item: ComparisonItem; description: string; sourceLabel?: string }) {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { isCompared, toggleComparison } = useComparison()
  const saved = isInWishlist(item.id, item.kind)
  const compared = isCompared(item.id, item.kind)
  const [now] = useState(() => Date.now())
  const deadline = new Date(item.deadline + (item.deadline.includes("T") ? "" : "T23:59:59Z"))
  const days = Math.ceil((deadline.getTime() - now) / 86400000)
  const date = deadline.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
  return <article className="opportunity-card group flex h-full min-w-0 flex-col rounded-2xl border border-border/80 bg-card p-5 sm:p-6">
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3"><div aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-sm font-bold text-primary">{item.organization.split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-semibold" title={item.organization}>{item.organization}</p><p className="mt-1 text-xs text-muted-foreground">{item.typeLabel}</p></div></div>
      <button type="button" className={`discovery-icon-button shrink-0 ${saved ? "bg-primary/10 text-primary" : "text-muted-foreground"}`} onClick={() => toggleWishlist(item.id, item.kind)} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} aria-pressed={saved}><Bookmark className={`size-5 ${saved ? "fill-current" : ""}`} /></button>
    </div>
    <Link href={item.href} className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"><h3 className="text-balance text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">{item.title}</h3></Link>
    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{htmlToPlainText(description).slice(0, 240)}</p>
    <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><MapPin className="size-4 shrink-0" />{item.location}</span>{item.compensation !== "unpaid" && <span className="font-medium text-primary">{item.compensation === "stipend" ? "Stipend offered" : "Paid"}</span>}</div>
    <div className="mb-5 mt-3 flex flex-wrap gap-2">{item.field.split(",").slice(0, 2).filter(Boolean).map(field => <span key={field} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{field.trim()}</span>)}{sourceLabel && <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground" title={sourceLabel === "Listed by our team" ? "Published by Graduates Corner. Confirm terms with the original source." : "The publisher's account has been verified; vacancy terms must still be checked."}><Check className="size-3" />{sourceLabel}</span>}</div>
    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4"><p className={`inline-flex items-center gap-1.5 text-xs ${days >= 0 && days <= 7 ? "font-semibold text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}><CalendarDays className="size-4" />{days < 0 ? "Applications closed" : `Apply by ${date}`}</p><div className="flex items-center gap-1"><button className={`discovery-icon-button ${compared ? "bg-primary/10 text-primary" : "text-muted-foreground"}`} aria-label={compared ? "Remove from comparison" : "Add to comparison"} aria-pressed={compared} onClick={() => toggleComparison(item)}><GitCompareArrows className="size-4" /></button><Link href={item.href} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-primary/5">View role <ArrowUpRight className="size-4" /></Link></div></div>
  </article>
}
