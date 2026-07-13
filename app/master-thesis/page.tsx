"use client"

import { useState, useMemo, useEffect, type ElementType } from "react"
import { PublicLayout } from "@/components/layout/public-layout"
import { ThesisCard } from "@/components/shared/thesis-card"
import { FilterPanel, type FilterSection } from "@/components/shared/filter-panel"
import { OpportunityIntelligencePanel } from "@/components/shared/opportunity-intelligence-panel"
import { OpportunitySortSelect } from "@/components/shared/opportunity-sort-select"
import { OpportunityGridSkeleton } from "@/components/shared/opportunity-grid-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth-context"
import type { Thesis } from "@/lib/data/types"
import { Search, SlidersHorizontal, X, BookOpen, Building2, MapPin, Sparkles, Heart } from "lucide-react"
import { getDeadlineBucket, getWorkMode, matchesDeadline, matchesWorkMode } from "@/lib/opportunity-filters"
import { sortOpportunityResults, type OpportunitySort } from "@/lib/opportunity-sort"


export default function MasterThesisPage() {
  const { supabase } = useAuth()
  const [theses, setTheses] = useState<Thesis[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<OpportunitySort>("recommended")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Record<string, string[]>>({
    field: [],
    location: [],
    compensation: [],
    deadline: [],
    workMode: [],
    organizationType: [],
    trust: [],
  })

  useEffect(() => {
    const fetchTheses = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('theses')
        .select('*, profiles:posted_by_user_id (is_verified, verification_badge)')
        .eq('status', 'approved')
        .eq('type', 'master')

      if (error) {
        console.error('Unable to load thesis opportunities.')
      } else {
        // Map snake_case from DB to camelCase in Thesis type
        const formattedData = data.map((t: any) => ({
          id: t.id,
          title: t.title,
          type: t.type,
          description: t.description,
          subject: t.subject,
          organization: t.organization,
          organizationType: t.organization_type,
          location: t.location,
          compensation: t.compensation,
          deadline: t.deadline,
          postedBy: t.posted_by,
          postedByUserId: t.posted_by_user_id,
          externalUrl: t.external_url,
          status: t.status,
          createdAt: t.created_at,
          organizationVerified: t.posted_by === "admin" || Boolean(t.profiles?.is_verified),
          verificationBadge: t.profiles?.verification_badge || "verified",
        }))
        setTheses(formattedData)
      }
      setLoading(false)
    }

    fetchTheses()
  }, [supabase])

  /* Toggle a filter value */
  const handleToggle = (sectionId: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [sectionId]: prev[sectionId].includes(value)
        ? prev[sectionId].filter((v) => v !== value)
        : [...prev[sectionId], value],
    }))
  }

  const handleClearAll = () => {
    setFilters({ field: [], location: [], compensation: [], deadline: [], workMode: [], organizationType: [], trust: [] })
  }

  const activeFilterCount = Object.values(filters).reduce(
    (acc, arr) => acc + arr.length,
    0
  )

  /* Build filter sections with counts */
  const filterSections: FilterSection[] = useMemo(() => {
    /* Field counts */
    const fieldCounts: Record<string, number> = {}
    theses.forEach((t) => {
      // Support comma-separated subjects
      const subjects = t.subject.split(',').map(s => s.trim())
      subjects.forEach(s => {
        if (s) fieldCounts[s] = (fieldCounts[s] || 0) + 1
      })
    })

    /* Location tree from data */
    const locTree: Record<string, Record<string, number>> = {}
    theses.forEach((t) => {
      const parts = t.location.split(", ")
      const country = parts[parts.length - 1]
      const city = parts.slice(0, -1).join(", ") || parts[0]
      if (!locTree[country]) locTree[country] = {}
      locTree[country][city] = (locTree[country][city] || 0) + 1
    })

    /* Merge data locations into the filter options — only show locations with data */
    const locationOptions = Object.entries(locTree)
      .sort((a, b) => {
        const countA = Object.values(a[1]).reduce((s, c) => s + c, 0)
        const countB = Object.values(b[1]).reduce((s, c) => s + c, 0)
        return countB - countA
      })
      .map(([country, cities]) => {
        const countryCount = Object.values(cities).reduce((s, c) => s + c, 0)

        return {
          value: country,
          label: country,
          count: countryCount,
          children: Object.entries(cities)
            .sort((a, b) => b[1] - a[1])
            .map(([city, count]) => ({
              value: `${city}, ${country}`,
              label: city,
              count: count,
            })),
        }
      })

    /* Compensation counts */
    const compCounts: Record<string, number> = {}
    theses.forEach((t) => {
      compCounts[t.compensation] = (compCounts[t.compensation] || 0) + 1
    })
    const deadlineCounts = theses.reduce<Record<string, number>>((acc, t) => {
      const bucket = getDeadlineBucket(t.deadline)
      acc[bucket] = (acc[bucket] || 0) + 1
      return acc
    }, {})
    const workModeCounts = theses.reduce<Record<string, number>>((acc, t) => {
      const mode = getWorkMode(t.location)
      acc[mode] = (acc[mode] || 0) + 1
      return acc
    }, {})
    const orgCounts = theses.reduce<Record<string, number>>((acc, t) => {
      acc[t.organizationType] = (acc[t.organizationType] || 0) + 1
      return acc
    }, {})

    return [
      {
        id: "field",
        label: "Field",
        type: "checkbox" as const,
        // Built from actual DB data — only real subjects appear, custom ones included
        options: Object.entries(fieldCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([subject, count]) => ({ value: subject, label: subject, count })),
        maxVisible: 6,
      },
      {
        id: "location",
        label: "Location",
        type: "location" as const,
        options: locationOptions,
        maxVisible: 6,
      },
      {
        id: "compensation",
        label: "Compensation",
        type: "checkbox" as const,
        options: [
          { value: "paid", label: "Paid", count: compCounts["paid"] || 0 },
          {
            value: "unpaid",
            label: "Unpaid",
            count: compCounts["unpaid"] || 0,
          },
          {
            value: "stipend",
            label: "Stipend",
            count: compCounts["stipend"] || 0,
          },
        ],
      },
      {
        id: "deadline",
        label: "Deadline",
        type: "checkbox" as const,
        options: [
          { value: "3days", label: "Due in 3 days", count: deadlineCounts["3days"] || 0 },
          { value: "7days", label: "Due in 7 days", count: deadlineCounts["7days"] || 0 },
          { value: "30days", label: "Due in 30 days", count: deadlineCounts["30days"] || 0 },
          { value: "later", label: "Later", count: deadlineCounts["later"] || 0 },
        ],
      },
      {
        id: "workMode",
        label: "Work mode",
        type: "checkbox" as const,
        options: [
          { value: "remote", label: "Remote", count: workModeCounts.remote || 0 },
          { value: "hybrid", label: "Hybrid", count: workModeCounts.hybrid || 0 },
          { value: "on-site", label: "On-site", count: workModeCounts["on-site"] || 0 },
        ],
      },
      {
        id: "organizationType",
        label: "Organization",
        type: "checkbox" as const,
        options: [
          { value: "university", label: "University", count: orgCounts.university || 0 },
          { value: "company", label: "Company", count: orgCounts.company || 0 },
        ],
      },
      {
        id: "trust",
        label: "Trust",
        type: "checkbox" as const,
        options: [
          {
            value: "verified",
            label: "Verified organizations",
            count: theses.filter((t) => t.organizationVerified || t.postedBy === "admin").length,
          },
        ],
      },
    ]
  }, [theses])

  /* Filtered results */
  const filtered = useMemo(() => {
    return theses
      .filter((t) => {
        if (search) {
          const q = search.toLowerCase()
          return (
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.organization.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q)
          )
        }
        return true
      })
      .filter((t) => {
        if (filters.field.length === 0) return true
        const itemSubjects = t.subject.split(',').map(s => s.trim())
        return filters.field.some(f => itemSubjects.includes(f))
      })
      .filter((t) => {
        if (filters.location.length === 0) return true
        return filters.location.some((loc) => {
          if (loc.includes(",")) {
            return t.location === loc
          }
          return (
            t.location.endsWith(`, ${loc}`) || t.location === loc
          )
        })
      })
      .filter((t) => {
        if (filters.compensation.length === 0) return true
        return filters.compensation.includes(t.compensation)
      })
      .filter((t) => matchesDeadline(t.deadline, filters.deadline))
      .filter((t) => matchesWorkMode(t.location, filters.workMode))
      .filter((t) => filters.organizationType.length === 0 || filters.organizationType.includes(t.organizationType))
      .filter((t) => {
        if (filters.trust.length === 0) return true
        return t.organizationVerified || t.postedBy === "admin"
      })
  }, [theses, search, filters])

  const sortedResults = useMemo(() => sortOpportunityResults(filtered, sort), [filtered, sort])

  const paidCount = theses.filter((t) => t.compensation === "paid" || t.compensation === "stipend").length
  const organizationCount = new Set(theses.map((t) => t.organization)).size
  const locationCount = new Set(theses.map((t) => t.location)).size
  const filteredPaidCount = filtered.filter((t) => t.compensation === "paid" || t.compensation === "stipend").length
  const filteredOrganizationCount = new Set(filtered.map((t) => t.organization)).size
  const filteredLocationCount = new Set(filtered.map((t) => t.location)).size
  const filteredVerifiedCount = filtered.filter((t) => t.organizationVerified || t.postedBy === "admin").length
  const popularSubjects = Object.entries(
    theses.reduce<Record<string, number>>((acc, thesis) => {
      thesis.subject.split(",").map((s) => s.trim()).filter(Boolean).forEach((subject) => {
        acc[subject] = (acc[subject] || 0) + 1
      })
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 4)

  return (
    <PublicLayout>
      <section className="relative overflow-hidden px-4 py-16 text-primary-foreground lg:py-20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2200&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(26,78,163,0.94)_0%,rgba(66,133,244,0.82)_48%,rgba(52,168,83,0.48)_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_24rem] lg:items-end">
          <div>
            <Badge className="mb-5 gap-2 border border-white/20 bg-white/12 text-white backdrop-blur">
              <BookOpen className="h-3.5 w-3.5" />
              Thesis discovery studio
            </Badge>
            <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight lg:text-6xl">Master&apos;s Thesis Positions</h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-white/82">
              Discover industry and university thesis projects with smarter filters, deadline awareness, and save-ready opportunity cards.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {popularSubjects.length > 0 ? popularSubjects.map(([subject]) => (
                <button key={subject} onClick={() => setSearch(subject)} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/18">
                  {subject}
                </button>
              )) : ["AI", "Sustainability", "Engineering", "Business"].map((subject) => (
                <button key={subject} onClick={() => setSearch(subject)} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/18">
                  {subject}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/18 bg-white/12 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.16)] backdrop-blur-xl">
            <p className="text-sm font-semibold text-white/78">Opportunity intelligence</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <HeroMetric icon={BookOpen} label="Open roles" value={theses.length} />
              <HeroMetric icon={Building2} label="Organizations" value={organizationCount} />
              <HeroMetric icon={MapPin} label="Locations" value={locationCount} />
              <HeroMetric icon={Sparkles} label="Funded" value={paidCount} />
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-30 -mt-8 px-4 pb-6 lg:top-16">
        <div className="mx-auto max-w-7xl rounded-2xl border border-border bg-card/95 p-3 shadow-[0_24px_80px_rgba(66,133,244,0.16)] backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="flex min-h-12 flex-1 items-center gap-3 rounded-xl bg-background px-4">
              <Search className="h-5 w-5 shrink-0 text-primary" />
              <input
                type="text"
                placeholder="Search by title, subject, organization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && <span className="text-xs">{activeFilterCount}</span>}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[86vh] overflow-y-auto rounded-t-2xl p-0">
                <SheetHeader className="border-b border-border p-4 text-left">
                  <SheetTitle>Refine thesis positions</SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <FilterPanel
                    sections={filterSections}
                    selected={filters}
                    onToggle={handleToggle}
                    onClearAll={handleClearAll}
                    activeCount={activeFilterCount}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </section>

      <OpportunityIntelligencePanel
        compact
        defaultTrack="thesis"
        totals={{
          total: filtered.length,
          funded: filteredPaidCount,
          verified: filteredVerifiedCount,
          locations: filteredLocationCount,
          organizations: filteredOrganizationCount,
        }}
        className="-mt-2 pb-4 pt-0"
      />

      <section className="px-4 py-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Curated thesis results</h2>
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filtered.length}</span> {filtered.length === 1 ? "position" : "positions"} from verified sources
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="hidden gap-2 sm:inline-flex">
                  <Heart className="h-3.5 w-3.5 text-[#ea4335]" />
                  Save and compare
                </Badge>
                <OpportunitySortSelect value={sort} onChange={setSort} />
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {Object.entries(filters).flatMap(([sectionId, values]) =>
                  values.map((v) => (
                    <Badge
                      key={`${sectionId}-${v}`}
                      variant="secondary"
                      className="cursor-pointer gap-1 text-xs"
                      onClick={() => handleToggle(sectionId, v)}
                    >
                      {v}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Filter sidebar */}
            <aside
              className="hidden w-full shrink-0 lg:block lg:w-[280px]"
            >
              <div className="lg:sticky lg:top-24">
                <FilterPanel
                  sections={filterSections}
                  selected={filters}
                  onToggle={handleToggle}
                  onClearAll={handleClearAll}
                  activeCount={activeFilterCount}
                />
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1">
              {loading ? (
                <OpportunityGridSkeleton />
              ) : filtered.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {sortedResults.map((thesis) => (
                    <ThesisCard key={thesis.id} thesis={thesis} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
                  <Search className="mb-4 h-12 w-12 text-muted-foreground/40" />
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    No positions found
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Try adjusting your filters or search terms
                  </p>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAll}
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

function HeroMetric({ icon: Icon, label, value }: { icon: ElementType; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/12 p-3 ring-1 ring-white/10">
      <Icon className="mb-2 h-4 w-4 text-white/80" />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[11px] font-medium text-white/62">{label}</p>
    </div>
  )
}
