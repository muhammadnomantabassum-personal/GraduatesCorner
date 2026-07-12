"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

const STORAGE_KEY = "gc_opportunity_comparison"
const MAX_ITEMS = 3

export type ComparisonItem = {
  id: string
  kind: "thesis" | "program"
  typeLabel: string
  title: string
  organization: string
  field: string
  location: string
  compensation: string
  deadline: string
  duration?: string
  workMode: string
  verified: boolean
  signalScore: number
  href: string
}

type ComparisonContextValue = {
  items: ComparisonItem[]
  isCompared: (id: string, kind: ComparisonItem["kind"]) => boolean
  toggleComparison: (item: ComparisonItem) => void
  removeComparison: (id: string, kind: ComparisonItem["kind"]) => void
  clearComparison: () => void
}

const ComparisonContext = createContext<ComparisonContextValue | null>(null)

function isStoredItem(value: unknown): value is ComparisonItem {
  if (!value || typeof value !== "object") return false
  const item = value as Partial<ComparisonItem>
  return (
    typeof item.id === "string" &&
    (item.kind === "thesis" || item.kind === "program") &&
    typeof item.title === "string" &&
    typeof item.organization === "string" &&
    typeof item.href === "string" &&
    ["/theses/", "/phd-positions/", "/trainee-programs/"].some((prefix) => item.href?.startsWith(prefix))
  )
}

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ComparisonItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
      if (Array.isArray(stored)) setItems(stored.filter(isStoredItem).slice(0, MAX_ITEMS))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [hydrated, items])

  const isCompared = useCallback(
    (id: string, kind: ComparisonItem["kind"]) => items.some((item) => item.id === id && item.kind === kind),
    [items]
  )

  const removeComparison = useCallback((id: string, kind: ComparisonItem["kind"]) => {
    setItems((current) => current.filter((item) => item.id !== id || item.kind !== kind))
  }, [])

  const toggleComparison = useCallback((item: ComparisonItem) => {
    const exists = items.some((candidate) => candidate.id === item.id && candidate.kind === item.kind)
    if (exists) {
      setItems(items.filter((candidate) => candidate.id !== item.id || candidate.kind !== item.kind))
      return
    }

    if (items.length >= MAX_ITEMS) {
      toast.info("Comparison is full", { description: "Remove one opportunity before adding another." })
      return
    }

    setItems([...items, item])
    toast.success("Added to comparison")
  }, [items])

  const clearComparison = useCallback(() => setItems([]), [])

  const value = useMemo(
    () => ({ items, isCompared, toggleComparison, removeComparison, clearComparison }),
    [items, isCompared, toggleComparison, removeComparison, clearComparison]
  )

  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>
}

export function useComparison() {
  const context = useContext(ComparisonContext)
  if (!context) throw new Error("useComparison must be used inside ComparisonProvider")
  return context
}
