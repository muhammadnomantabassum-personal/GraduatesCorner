"use client"

import { useState, useMemo, useEffect } from "react"
import { PublicLayout } from "@/components/layout/public-layout"
import { ThesisCard } from "@/components/shared/thesis-card"
import { FilterPanel, type FilterSection } from "@/components/shared/filter-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import type { Thesis } from "@/lib/data/types"
import { locations } from "@/lib/data/locations"
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react"


export default function MasterThesisPage() {
  const { supabase } = useAuth()
  const [theses, setTheses] = useState<Thesis[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Record<string, string[]>>({
    field: [],
    location: [],
    compensation: [],
  })

  useEffect(() => {
    const fetchTheses = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('theses')
        .select('*')
        .eq('status', 'approved')
        .eq('type', 'master')

      if (error) {
        console.error('Error fetching theses:', error)
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
    setFilters({ field: [], location: [], compensation: [] })
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
        // Find cities from our static list for this country to "enrich" but filter by counts
        const refLoc = locations.find((l) => l.country === country)
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
  }, [theses, search, filters])

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="border-b border-border bg-primary px-4 py-12 text-primary-foreground lg:py-16">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-3 text-3xl font-bold lg:text-4xl">Master's Thesis Positions</h1>
          <p className="mb-6 text-lg text-primary-foreground/80">
            Find master thesis opportunities from universities and companies worldwide
          </p>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-card px-4 py-2.5">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title, subject, organization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground lg:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="text-xs">{activeFilterCount}</span>
              )}
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          {/* Results summary */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">
                {filtered.length}
              </span>{" "}
              {filtered.length === 1 ? "position" : "positions"}
            </p>
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
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
              className={`w-full shrink-0 lg:block lg:w-[280px] ${showFilters ? "block" : "hidden"
                }`}
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
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-4 text-muted-foreground">Loading thesis...</p>
                </div>
              ) : filtered.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {filtered.map((thesis) => (
                    <ThesisCard key={thesis.id} thesis={thesis} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
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
