"use client"

import { useState, useMemo, useEffect } from "react"
import { PublicLayout } from "@/components/layout/public-layout"
import { ProgramCard } from "@/components/shared/program-card"
import { FilterPanel, type FilterSection } from "@/components/shared/filter-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import type { TraineeProgram } from "@/lib/data/types"
import { locations } from "@/lib/data/locations"
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react"


/* Duration options */
const durationOptions = [
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "9", label: "9 months" },
  { value: "12", label: "12 months" },
  { value: "18", label: "18 months" },
  { value: "24", label: "24 months" },
  { value: "36", label: "36 months" },
]

export default function TraineeProgramsPage() {
  const { supabase } = useAuth()
  const [programs, setPrograms] = useState<TraineeProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Record<string, string[]>>({
    field: [],
    location: [],
    compensation: [],
    duration: [],
  })

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('trainee_programs')
        .select('*')
        .eq('status', 'approved')

      if (error) {
        console.error('Error fetching trainee programs:', error)
      } else {
        const formattedData = data.map((p: any) => ({
          id: p.id,
          title: p.title,
          company: p.company,
          description: p.description,
          field: p.field,
          location: p.location,
          duration: p.duration,
          compensation: p.compensation,
          deadline: p.deadline,
          postedBy: p.posted_by,
          postedByUserId: p.posted_by_user_id,
          externalUrl: p.external_url,
          status: p.status,
          createdAt: p.created_at,
        }))
        setPrograms(formattedData)
      }
      setLoading(false)
    }

    fetchPrograms()
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
    setFilters({ field: [], location: [], compensation: [], duration: [] })
  }

  const activeFilterCount = Object.values(filters).reduce(
    (acc, arr) => acc + arr.length,
    0
  )

  /* Build filter sections with counts */
  const filterSections: FilterSection[] = useMemo(() => {
    /* Field counts */
    const fieldCounts: Record<string, number> = {}
    programs.forEach((p) => {
      // Support comma-separated fields
      const fields = p.field.split(',').map(f => f.trim())
      fields.forEach(f => {
        if (f) fieldCounts[f] = (fieldCounts[f] || 0) + 1
      })
    })

    /* Location tree from data */
    const locTree: Record<string, Record<string, number>> = {}
    programs.forEach((p) => {
      const parts = p.location.split(", ")
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
    programs.forEach((p) => {
      compCounts[p.compensation] = (compCounts[p.compensation] || 0) + 1
    })

    /* Duration counts */
    const durCounts: Record<string, number> = {}
    programs.forEach((p) => {
      const months = p.duration.replace(/[^0-9]/g, "")
      durCounts[months] = (durCounts[months] || 0) + 1
    })

    return [
      {
        id: "field",
        label: "Field",
        type: "checkbox" as const,
        // Built from actual DB data — only real fields appear, custom ones included
        options: Object.entries(fieldCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([field, count]) => ({ value: field, label: field, count })),
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
        id: "duration",
        label: "Duration",
        type: "checkbox" as const,
        options: durationOptions.map((d) => ({
          value: d.value,
          label: d.label,
          count: durCounts[d.value] || 0,
        })),
      },
    ]
  }, [programs])

  /* Filtered results */
  const filtered = useMemo(() => {
    return programs
      .filter((p) => {
        if (search) {
          const q = search.toLowerCase()
          return (
            p.title.toLowerCase().includes(q) ||
            p.company.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.field.toLowerCase().includes(q)
          )
        }
        return true
      })
      .filter((p) => {
        if (filters.field.length === 0) return true
        const itemFields = p.field.split(',').map(f => f.trim())
        return filters.field.some(f => itemFields.includes(f))
      })
      .filter((p) => {
        if (filters.location.length === 0) return true
        return filters.location.some((loc) => {
          if (loc.includes(",")) {
            return p.location === loc
          }
          return (
            p.location.endsWith(`, ${loc}`) || p.location === loc
          )
        })
      })
      .filter((p) => {
        if (filters.compensation.length === 0) return true
        return filters.compensation.includes(p.compensation)
      })
      .filter((p) => {
        if (filters.duration.length === 0) return true
        const months = p.duration.replace(/[^0-9]/g, "")
        return filters.duration.includes(months)
      })
  }, [programs, search, filters])

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="border-b border-border bg-primary px-4 py-12 text-primary-foreground lg:py-16">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-3 text-3xl font-bold lg:text-4xl">
            Graduate Trainee Programs
          </h1>
          <p className="mb-6 text-lg text-primary-foreground/80">
            Launch your career with structured graduate programs at leading
            companies
          </p>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-card px-4 py-2.5">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title, company, field..."
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
              {filtered.length === 1 ? "program" : "programs"}
            </p>
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {Object.entries(filters).flatMap(([sectionId, values]) =>
                  values.map((v) => {
                    const displayLabel =
                      sectionId === "duration" ? `${v} months` : v
                    return (
                      <Badge
                        key={`${sectionId}-${v}`}
                        variant="secondary"
                        className="cursor-pointer gap-1 text-xs"
                        onClick={() => handleToggle(sectionId, v)}
                      >
                        {displayLabel}
                        <X className="h-3 w-3" />
                      </Badge>
                    )
                  })
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
                  <p className="mt-4 text-muted-foreground">Loading trainee programs...</p>
                </div>
              ) : filtered.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {filtered.map((program) => (
                    <ProgramCard key={program.id} program={program} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
                  <Search className="mb-4 h-12 w-12 text-muted-foreground/40" />
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    No programs found
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
