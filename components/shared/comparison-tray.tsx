"use client"

import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowUpRight, Check, GitCompareArrows, Trash2, X } from "lucide-react"
import { useComparison } from "@/lib/comparison-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const rows = [
  { label: "Organization", key: "organization" },
  { label: "Field", key: "field" },
  { label: "Location", key: "location" },
  { label: "Work mode", key: "workMode" },
  { label: "Compensation", key: "compensation" },
  { label: "Deadline", key: "deadline" },
  { label: "Duration", key: "duration" },
  { label: "Verified", key: "verified" },
  { label: "Signal score", key: "signalScore" },
] as const

export function ComparisonTray() {
  const { items, removeComparison, clearComparison } = useComparison()
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.aside
          initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-4xl rounded-lg border border-border/80 bg-card/96 p-2 shadow-[0_22px_70px_rgba(15,23,42,0.24)] backdrop-blur-xl sm:bottom-5 sm:p-3"
          aria-label="Opportunity comparison"
        >
          <div className="flex items-center gap-2">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground sm:flex">
              <GitCompareArrows className="h-4 w-4" />
            </div>

            <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto scrollbar-none">
              {items.map((item) => (
                <div
                  key={`${item.kind}-${item.id}`}
                  className="flex min-w-[9rem] max-w-[13rem] items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{item.title}</span>
                  <button
                    type="button"
                    onClick={() => removeComparison(item.id, item.kind)}
                    className="shrink-0 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    aria-label={`Remove ${item.title} from comparison`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {Array.from({ length: 3 - items.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="hidden min-w-[7rem] items-center justify-center rounded-md border border-dashed border-border px-3 text-[11px] text-muted-foreground md:flex"
                >
                  Add another
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={clearComparison}
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:flex"
              aria-label="Clear comparison"
              title="Clear comparison"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <Dialog>
              <DialogTrigger asChild>
                <Button disabled={items.length < 2} className="shrink-0 gap-2">
                  <GitCompareArrows className="h-4 w-4" />
                  <span className="hidden sm:inline">Compare</span>
                  <span className="sm:hidden">{items.length}/3</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[88vh] max-w-[calc(100vw-1.5rem)] overflow-hidden p-0 sm:max-w-5xl">
                <DialogHeader className="border-b border-border px-5 py-4 text-left sm:px-6">
                  <DialogTitle className="flex items-center gap-2">
                    <GitCompareArrows className="h-5 w-5 text-primary" />
                    Compare opportunities
                  </DialogTitle>
                  <DialogDescription>Review the decision-critical details side by side.</DialogDescription>
                </DialogHeader>

                <div className="overflow-auto px-4 pb-5 sm:px-6">
                  <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-10 w-36 border-b border-border bg-card py-4 pr-4 text-xs font-semibold text-muted-foreground">Criteria</th>
                        {items.map((item) => (
                          <th key={`${item.kind}-${item.id}`} className="min-w-52 border-b border-border px-4 py-4 align-top">
                            <Badge variant="secondary" className="mb-2">{item.typeLabel}</Badge>
                            <Link href={item.href} className="block text-sm font-bold leading-snug text-foreground hover:text-primary">
                              {item.title}
                            </Link>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.key}>
                          <th className="sticky left-0 z-10 border-b border-border/60 bg-card py-3 pr-4 text-xs font-semibold text-muted-foreground">{row.label}</th>
                          {items.map((item) => (
                            <td key={`${item.kind}-${item.id}-${row.key}`} className="border-b border-border/60 px-4 py-3 text-sm text-foreground">
                              <ComparisonValue item={item} field={row.key} />
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr>
                        <th className="sticky left-0 bg-card py-4 pr-4" />
                        {items.map((item) => (
                          <td key={`${item.kind}-${item.id}-action`} className="px-4 py-4">
                            <Button asChild size="sm" className="w-full gap-2">
                              <Link href={item.href}>
                                View opportunity
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {items.length < 2 && <p className="mt-1.5 px-1 text-[10px] text-muted-foreground sm:hidden">Add one more opportunity to compare.</p>}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function ComparisonValue({ item, field }: { item: import("@/lib/comparison-context").ComparisonItem; field: typeof rows[number]["key"] }) {
  if (field === "verified") {
    return item.verified ? (
      <span className="inline-flex items-center gap-1.5 font-semibold text-[#137333]"><Check className="h-4 w-4" /> Verified</span>
    ) : "Not verified"
  }
  if (field === "signalScore") return `${item.signalScore}%`
  if (field === "deadline") {
    const date = new Date(item.deadline)
    return Number.isNaN(date.getTime()) ? item.deadline : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  }

  const value = item[field]
  return typeof value === "string" && value.trim() ? value : "Not specified"
}
