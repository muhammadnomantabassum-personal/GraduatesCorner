"use client"

import { useState, useMemo, useEffect, type ElementType } from "react"
import { PublicLayout } from "@/components/layout/public-layout"
import { ProgramCard } from "@/components/shared/program-card"
import { FilterPanel, type FilterSection } from "@/components/shared/filter-panel"
import { OpportunityIntelligencePanel } from "@/components/shared/opportunity-intelligence-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import type { TraineeProgram } from "@/lib/data/types"
import { Search, SlidersHorizontal, X, Loader2, Briefcase, Building2, MapPin, Heart, Sparkles } from "lucide-react"


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
    trust: [],
  })

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('trainee_programs')
        .select('*, profiles:posted_by_user_id (is_verified, verification_badge)')
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
          organizationVerified: p.posted_by === "admin" || Boolean(p.profiles?.is_verified),
          verificationBadge: p.profiles?.verification_badge || "verified",
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
    setFilters({ field: [], location: [], compensation: [], duration: [], trust: [] })
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
      {
        id: "trust",
        label: "Trust",
        type: "checkbox" as const,
        options: [
          {
            value: "verified",
            label: "Verified companies",
            count: programs.filter((p) => p.organizationVerified || p.postedBy === "admin").length,
          },
        ],
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
      .filter((p) => {
        if (filters.trust.length === 0) return true
        return p.organizationVerified || p.postedBy === "admin"
      })
  }, [programs, search, filters])

  const paidCount = programs.filter((p) => p.compensation === "paid" || p.compensation === "stipend").length
  const companyCount = new Set(programs.map((p) => p.company)).size
  const locationCount = new Set(programs.map((p) => p.location)).size
  const filteredPaidCount = filtered.filter((p) => p.compensation === "paid" || p.compensation === "stipend").length
  const filteredCompanyCount = new Set(filtered.map((p) => p.company)).size
  const filteredLocationCount = new Set(filtered.map((p) => p.location)).size
  const filteredVerifiedCount = filtered.filter((p) => p.organizationVerified || p.postedBy === "admin").length
  const popularFields = Object.entries(
    programs.reduce<Record<string, number>>((acc, program) => {
      program.field.split(",").map((f) => f.trim()).filter(Boolean).forEach((field) => {
        acc[field] = (acc[field] || 0) + 1
      })
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 4)

  return (
    <PublicLayout>
      <section className="relative overflow-hidden px-4 py-16 text-primary-foreground lg:py-20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=2200&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(43,50,98,0.94)_0%,rgba(66,133,244,0.82)_44%,rgba(251,188,5,0.48)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(52,168,83,0.24),transparent_20rem)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_24rem] lg:items-end">
          <div>
            <Badge className="mb-5 gap-2 border border-white/20 bg-white/12 text-white backdrop-blur">
              <Briefcase className="h-3.5 w-3.5" />
              Graduate career pipeline
            </Badge>
            <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight lg:text-6xl">Graduate Trainee Programs</h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-white/82">
              Launch your career with structured programs from leading companies, sortable by field, duration, location, and compensation.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {popularFields.length > 0 ? popularFields.map(([field]) => (
                <button key={field} onClick={() => setSearch(field)} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/18">
                  {field}
                </button>
              )) : ["Technology", "Finance", "Engineering", "Business"].map((field) => (
                <button key={field} onClick={() => setSearch(field)} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/18">
                  {field}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/18 bg-white/12 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.16)] backdrop-blur-xl">
            <p className="text-sm font-semibold text-white/78">Career intelligence</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <HeroMetric icon={Briefcase} label="Programs" value={programs.length} />
              <HeroMetric icon={Building2} label="Companies" value={companyCount} />
              <HeroMetric icon={MapPin} label="Locations" value={locationCount} />
              <HeroMetric icon={Sparkles} label="Funded" value={paidCount} />
            </div>
          </div>
        </div>
      </section>

      <section className="relative -mt-8 px-4 pb-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-border bg-card/95 p-3 shadow-[0_24px_80px_rgba(251,188,5,0.16)] backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="flex min-h-12 flex-1 items-center gap-3 rounded-xl bg-background px-4">
              <Search className="h-5 w-5 shrink-0 text-primary" />
              <input
                type="text"
                placeholder="Search by title, company, field..."
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
            <Button variant="outline" className="gap-2 lg:hidden" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && <span className="text-xs">{activeFilterCount}</span>}
            </Button>
          </div>
        </div>
      </section>

      <OpportunityIntelligencePanel
        compact
        defaultTrack="trainee"
        totals={{
          total: filtered.length,
          funded: filteredPaidCount,
          verified: filteredVerifiedCount,
          locations: filteredLocationCount,
          organizations: filteredCompanyCount,
        }}
        className="-mt-2 pb-4 pt-0"
      />

      <section className="px-4 py-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Curated trainee programs</h2>
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filtered.length}</span> {filtered.length === 1 ? "program" : "programs"} from career-building companies
                </p>
              </div>
              <Badge variant="outline" className="gap-2">
                <Heart className="h-3.5 w-3.5 text-[#ea4335]" />
                Save with wishlist
              </Badge>
            </div>
            {activeFilterCount > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
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
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20">
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
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
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

function HeroMetric({ icon: Icon, label, value }: { icon: ElementType; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/12 p-3 ring-1 ring-white/10">
      <Icon className="mb-2 h-4 w-4 text-white/80" />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[11px] font-medium text-white/62">{label}</p>
    </div>
  )
}
