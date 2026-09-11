"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, SlidersHorizontal, X, LayoutGrid, List, ArrowUpRight, RotateCcw, ArrowDown } from "lucide-react"
import { PublicLayout } from "@/components/layout/public-layout"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
import { FilterPanel, type FilterSection } from "./filter-panel"
import { ThesisCard } from "./thesis-card"
import { ProgramCard } from "./program-card"
import { OpportunityGridSkeleton } from "./opportunity-grid-skeleton"
import { OpportunitySeoContent } from "@/components/seo/opportunity-seo-content"
import { useAuth } from "@/lib/auth-context"
import { seoCountry } from "@/lib/seo-location"
import { getWorkMode, getDaysUntil, matchesWorkMode } from "@/lib/opportunity-filters"
import { sortOpportunityResults } from "@/lib/opportunity-sort"
import { discoveryTracks, mapDiscoveryRecord, parseDiscoveryQuery, serializeDiscoveryQuery, type DiscoveryQuery, type DiscoveryTrack } from "@/lib/discovery"

const copy = {
  phd: { title: "A new question. Your next chapter.", text: "Find a PhD project that connects your curiosity to meaningful research.", label: "PhD positions" },
  master: { title: "Turn your knowledge into experience.", text: "Explore master’s thesis projects and internships with universities and industry.", label: "Theses & internships" },
  trainee: { title: "Your first step. More possibilities.", text: "Explore graduate programs that give you room to learn, grow and find your direction.", label: "Graduate programs" },
}

export function DiscoveryBrowser({ track }: { track: DiscoveryTrack }) {
  const { supabase } = useAuth()
  const [items, setItems] = useState<ReturnType<typeof mapDiscoveryRecord>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState(() => parseDiscoveryQuery(""))
  const [ready, setReady] = useState(false)
  const [visible, setVisible] = useState(24)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const deferredSearch = useDeferredValue(query.search)
  const { filters } = query
  useEffect(() => {
    const restore = () => { setQuery(parseDiscoveryQuery(window.location.search)); setVisible(24); setReady(true) }
    restore()
    window.addEventListener("popstate", restore)
    return () => window.removeEventListener("popstate", restore)
  }, [])
  useEffect(() => {
    if (!ready) return
    const search = serializeDiscoveryQuery(query)
    window.history.replaceState(window.history.state, "", window.location.pathname + (search ? `?${search}` : ""))
  }, [query, ready])
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setError(false)
      try {
        const records: ReturnType<typeof mapDiscoveryRecord>[] = []
        for (let from = 0; ; from += 1000) {
          let request = supabase.from(track === "trainee" ? "trainee_programs" : "theses").select("*").eq("status", "approved").gte("deadline", new Date().toISOString().slice(0, 10)).order("id").range(from, from + 999)
          if (track !== "trainee") request = request.eq("type", track)
          const { data, error } = await request
          if (error) throw error
          records.push(...(data || []).map(mapDiscoveryRecord))
          if (!active) return
          if (!data || data.length < 1000) break
        }
        if (active) setItems(records)
      } catch { if (active) setError(true) }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [supabase, track, attempt])

  function update(change: Partial<DiscoveryQuery>) { setQuery(previous => ({ ...previous, ...change })); setVisible(24) }
  function toggle(key: string, value: string) { update({ filters: { ...filters, [key]: (filters[key] || []).includes(value) ? filters[key].filter(item => item !== value) : [...(filters[key] || []), value] } }) }
  function clear() { update({ search: "", filters: parseDiscoveryQuery("").filters }) }
  const sections = useMemo<FilterSection[]>(() => {
    const counts = (values: string[]) => Object.entries(values.reduce<Record<string, number>>((all, value) => { if (value) all[value] = (all[value] || 0) + 1; return all }, {})).sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, label: value, count }))
    return [
      ...(track === "master" ? [{ id: "kind", label: "Opportunity type", type: "checkbox" as const, options: [{ value: "master_thesis", label: "Master’s thesis" }, { value: "internship", label: "Internship" }] }] : []),
      { id: "location", label: "Country", type: "location", options: counts(items.map(item => seoCountry(item.location)?.name || item.location)), maxVisible: 6 },
      { id: "field", label: "Field of interest", type: "checkbox", options: counts(items.flatMap(item => (item.subject || item.field || "").split(",").map(value => value.trim()))), maxVisible: 5 },
      { id: "compensation", label: "Funding", type: "checkbox", options: [{ value: "paid", label: "Paid" }, { value: "stipend", label: "Stipend offered" }, { value: "unpaid", label: "Unpaid" }] },
      { id: "deadline", label: "Application deadline", type: "checkbox", options: [{ value: "7days", label: "Within 7 days" }, { value: "30days", label: "Within 30 days" }, { value: "later", label: "More time to apply" }] },
      { id: "workMode", label: "Work arrangement", type: "checkbox", options: counts(items.map(item => getWorkMode(item.location))) },
      ...(track !== "trainee" ? [{ id: "organizationType", label: "Organization", type: "checkbox" as const, options: [{ value: "university", label: "University" }, { value: "company", label: "Company" }] }] : []),
    ]
  }, [items, track])
  const results = useMemo(() => {
    const search = deferredSearch.toLowerCase().trim()
    return sortOpportunityResults(items.filter(item => {
      const field = item.subject || item.field || ""
      if (search && ![item.title, field, item.organization || item.company, item.location].join(" ").toLowerCase().includes(search)) return false
      if (filters.field.length && !filters.field.some(value => field.split(",").map(value => value.trim()).includes(value))) return false
      if (filters.location.length && !filters.location.some(value => value === seoCountry(item.location)?.name || item.location.toLowerCase().includes(value.toLowerCase()))) return false
      if (filters.kind.length && !filters.kind.includes(item.opportunityKind || "master_thesis")) return false
      if (filters.compensation.length && !filters.compensation.includes(item.compensation)) return false
      if (filters.organizationType.length && !filters.organizationType.includes(item.organizationType)) return false
      const days = getDaysUntil(item.deadline)
      const deadlineMatches = !filters.deadline.length || filters.deadline.some(value => value === "7days" ? days >= 0 && days <= 7 : value === "30days" ? days >= 0 && days <= 30 : value === "later" ? days > 30 : false)
      return deadlineMatches && matchesWorkMode(item.location, filters.workMode)
    }), query.sort)
  }, [items, deferredSearch, filters, query.sort])
  const count = Object.values(filters).reduce((sum, values) => sum + values.length, 0)
  const activeTrack = track === "master" && filters.kind.length === 1 && filters.kind[0] === "internship" ? "internship" : track
  const panel = <FilterPanel sections={sections} selected={filters} onToggle={toggle} onClearAll={clear} activeCount={count} />
  return <PublicLayout>
    <section className="discovery-hero border-b border-border/60 px-4 pb-8 pt-10 sm:pb-10 sm:pt-14"><div className="mx-auto max-w-7xl"><p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Explore your next chapter</p><h1 className="max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-5xl">{copy[track].title}</h1><p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{copy[track].text}</p>
      <nav aria-label="Opportunity types" className="mt-8 flex gap-2 overflow-x-auto pb-1">{discoveryTracks.map(tab => <Link key={tab.key} href={tab.href} onClick={event => { if (track === "master" && (tab.key === "master" || tab.key === "internship")) { event.preventDefault(); update({filters:{...filters,kind:[tab.key === "internship" ? "internship" : "master_thesis"]}}) } }} aria-current={activeTrack === tab.key ? "page" : undefined} className={`shrink-0 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${activeTrack === tab.key ? "bg-primary text-primary-foreground shadow-sm" : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{tab.label}</Link>)}</nav>
    </div></section>
    <section className="sticky top-16 z-30 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl gap-3"><div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-card px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"><Search className="size-5 shrink-0 text-primary" /><input aria-label="Search opportunities" type="search" value={query.search} onChange={event => update({ search: event.target.value })} placeholder="Search a topic, role or organization" className="w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm" />{query.search && <button className="discovery-icon-button" aria-label="Clear search" onClick={() => update({ search: "" })}><X className="size-4" /></button>}</div><Sheet open={filtersOpen} onOpenChange={setFiltersOpen}><SheetTrigger asChild><Button variant="outline" className="h-12 gap-2 rounded-xl lg:hidden"><SlidersHorizontal className="size-4" />Filters{count > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{count}</span>}</Button></SheetTrigger><SheetContent side="bottom" className="flex max-h-[88dvh] flex-col gap-0 rounded-t-3xl p-0"><SheetHeader className="border-b p-5 text-left"><SheetTitle>Make it your search</SheetTitle><SheetDescription>Choose what matters to you.</SheetDescription></SheetHeader><div className="overflow-y-auto p-4">{panel}</div><div className="border-t bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><Button className="h-12 w-full rounded-xl" onClick={() => setFiltersOpen(false)}>Show {results.length} opportunities</Button></div></SheetContent></Sheet></div></section>
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[240px_minmax(0,1fr)]"><aside className="hidden lg:block"><div className="sticky top-36 max-h-[calc(100dvh-10rem)] overflow-y-auto pr-1">{panel}</div></aside><div className="min-w-0">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><div aria-live="polite" aria-atomic="true"><h2 className="text-lg font-semibold">{loading ? "Finding opportunities…" : `${results.length} opportunities`}</h2><p className="mt-1 text-sm text-muted-foreground">{loading ? "Gathering the latest open roles" : "A little closer to your next chapter."}</p></div><div className="flex items-center gap-2"><label className="sr-only" htmlFor="discovery-sort">Sort opportunities</label><select id="discovery-sort" className="h-11 rounded-lg border bg-card px-3 text-sm" value={query.sort} onChange={event => update({ sort: event.target.value as DiscoveryQuery["sort"] })}><option value="newest">Newest first</option><option value="deadline">Closing soon</option><option value="funded">Funding first</option></select><div className="hidden items-center rounded-lg border bg-card p-1 sm:flex">{(["grid", "list"] as const).map(view => <button key={view} aria-label={`${view === "grid" ? "Grid" : "List"} view`} aria-pressed={query.view === view} onClick={() => update({ view })} className={`discovery-icon-button ${query.view === view ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>{view === "grid" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}</button>)}</div></div></div>
      {(count > 0 || query.search) && <div className="mb-5 flex flex-wrap gap-2">{Object.entries(filters).flatMap(([key, values]) => values.map(value => <button key={`${key}:${value}`} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 text-xs text-primary" onClick={() => toggle(key, value)} aria-label={`Remove ${value} filter`}>{sections.find(section => section.id === key)?.options.find(option => option.value === value)?.label || value}<X className="size-3" /></button>))}<button className="min-h-9 px-2 text-xs font-medium text-muted-foreground underline underline-offset-4" onClick={clear}>Clear all</button></div>}
      {loading ? <OpportunityGridSkeleton /> : error ? <div role="alert" className="rounded-2xl border bg-card p-10 text-center"><h3 className="text-lg font-semibold">We couldn’t load opportunities</h3><p className="my-3 text-sm text-muted-foreground">Your filters are saved. Please try again.</p><Button variant="outline" onClick={() => setAttempt(value => value + 1)}><RotateCcw className="mr-2 size-4" />Try again</Button></div> : results.length ? <><div className={`grid gap-4 ${query.view === "grid" ? "md:grid-cols-2" : "discovery-list"}`}>{results.slice(0, visible).map(item => track === "trainee" ? <ProgramCard key={item.id} program={item} /> : <ThesisCard key={item.id} thesis={item} />)}</div><div className="mt-8 flex flex-col items-center gap-3"><p className="text-sm text-muted-foreground">Showing {Math.min(visible, results.length)} of {results.length}</p>{visible < results.length && <Button variant="outline" className="h-12 rounded-xl bg-card px-6" onClick={() => setVisible(value => value + 24)}>Load more opportunities <ArrowDown className="ml-2 size-4" /></Button>}</div></> : <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center"><Search className="mx-auto mb-5 size-9 text-primary/60" /><h3 className="text-xl font-semibold">Let’s widen your search</h3><p className="mx-auto mb-6 mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">Try a broader topic or remove a country filter. The right opportunity may be one search away.</p><Button className="rounded-xl" onClick={clear}>Reset search</Button><Link href="/opportunities" className="mt-5 flex items-center justify-center gap-1 text-sm text-primary">Explore all opportunities <ArrowUpRight className="size-4" /></Link></div>}
    </div></section><OpportunitySeoContent type={track === "master" ? "thesis" : track === "trainee" ? "trainee" : "phd"} />
  </PublicLayout>
}
