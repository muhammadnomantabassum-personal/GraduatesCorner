"use client"
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import type { OpportunitySort } from "@/lib/opportunity-sort"

type Filters = Record<string, string[]>
export function useBrowseUrl({ search, setSearch, sort, setSort, filters, setFilters }: {
  search: string; setSearch: Dispatch<SetStateAction<string>>; sort: OpportunitySort; setSort: Dispatch<SetStateAction<OpportunitySort>>; filters: Filters; setFilters: Dispatch<SetStateAction<Filters>>
}) {
  const initial = useRef(filters)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(window.location.search)
      setSearch((params.get("q") || "").slice(0, 200))
      const value = params.get("sort")
      setSort(value === "newest" || value === "deadline" || value === "funded" ? value : "recommended")
      setFilters(Object.fromEntries(Object.keys(initial.current).map(key => [key, params.getAll(key).filter(value => value.length > 0 && value.length <= 160).slice(0, 20)])))
      setReady(true)
    }
    restore()
    window.addEventListener("popstate", restore)
    return () => window.removeEventListener("popstate", restore)
  }, [setSearch, setSort, setFilters])
  useEffect(() => {
    if (!ready) return
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (sort !== "recommended") params.set("sort", sort)
    for (const [key, values] of Object.entries(filters)) for (const value of values) params.append(key, value)
    const query = params.toString()
    window.history.replaceState(window.history.state, "", window.location.pathname + (query ? `?${query}` : ""))
  }, [search, sort, filters, ready])
}
