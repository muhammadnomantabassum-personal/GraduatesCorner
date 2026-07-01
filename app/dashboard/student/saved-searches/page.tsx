"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Compensation, SavedSearch, SavedSearchType } from "@/lib/data/types"
import {
  ArrowRight,
  Bell,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Loader2,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react"

type MatchItem = {
  id: string
  title: string
  description: string
  organization: string
  kind: SavedSearchType
  field: string
  location: string
  compensation: Compensation
  deadline: string
  createdAt: string
  href: string
}

const emptyForm = {
  title: "",
  query: "",
  opportunityType: "all" as SavedSearchType,
  field: "",
  location: "",
  compensation: "any" as Compensation | "any",
}

export default function StudentSavedSearchesPage() {
  const { user, supabase } = useAuth()
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [opportunities, setOpportunities] = useState<MatchItem[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadData = async () => {
      if (!user || user.type !== "student") {
        setSavedSearches([])
        setOpportunities([])
        setLoading(false)
        return
      }

      setLoading(true)
      const [searchRes, thesisRes, programRes] = await Promise.all([
        supabase
          .from("saved_searches")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("theses")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false }),
        supabase
          .from("trainee_programs")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false }),
      ])

      if (!active) return

      if (searchRes.error) {
        toast.error("Saved searches are not ready. Please add the saved_searches table in Supabase.")
      } else {
        setSavedSearches((searchRes.data || []).map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          title: item.title,
          query: item.query || "",
          opportunityType: item.opportunity_type || "all",
          field: item.field || "",
          location: item.location || "",
          compensation: item.compensation || "any",
          createdAt: item.created_at,
        })))
      }

      const thesisMatches: MatchItem[] = (thesisRes.data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        organization: item.organization,
        kind: item.type,
        field: item.subject,
        location: item.location,
        compensation: item.compensation,
        deadline: item.deadline,
        createdAt: item.created_at,
        href: `/theses/${item.id}`,
      }))

      const programMatches: MatchItem[] = (programRes.data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        organization: item.company,
        kind: "trainee",
        field: item.field,
        location: item.location,
        compensation: item.compensation,
        deadline: item.deadline,
        createdAt: item.created_at,
        href: `/trainee-programs/${item.id}`,
      }))

      setOpportunities([...thesisMatches, ...programMatches])
      setLoading(false)
    }

    loadData()
    return () => {
      active = false
    }
  }, [user, supabase])

  const searchResults = useMemo(() => {
    const result = new Map<string, MatchItem[]>()

    savedSearches.forEach((savedSearch) => {
      result.set(savedSearch.id, opportunities.filter((item) => matchesSearch(item, savedSearch)))
    })

    return result
  }, [opportunities, savedSearches])

  const handleSaveSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) return

    const hasCriteria = form.query.trim() || form.field.trim() || form.location.trim() || form.compensation !== "any" || form.opportunityType !== "all"
    if (!form.title.trim() || !hasCriteria) {
      toast.error("Add a title and at least one search condition")
      return
    }

    setSaving(true)
    const { data, error } = await supabase
      .from("saved_searches")
      .insert({
        user_id: user.id,
        title: form.title.trim(),
        query: form.query.trim(),
        opportunity_type: form.opportunityType,
        field: form.field.trim() || null,
        location: form.location.trim() || null,
        compensation: form.compensation,
      })
      .select("*")
      .single()

    setSaving(false)

    if (error) {
      toast.error("Could not save search. The database table may need to be added first.")
      return
    }

    setSavedSearches((current) => [{
      id: data.id,
      userId: data.user_id,
      title: data.title,
      query: data.query || "",
      opportunityType: data.opportunity_type || "all",
      field: data.field || "",
      location: data.location || "",
      compensation: data.compensation || "any",
      createdAt: data.created_at,
    }, ...current])
    setForm(emptyForm)
    toast.success("Search saved")
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const { error } = await supabase
      .from("saved_searches")
      .delete()
      .eq("id", id)

    setDeletingId(null)

    if (error) {
      toast.error("Could not delete saved search")
      return
    }

    setSavedSearches((current) => current.filter((item) => item.id !== id))
    toast.success("Saved search deleted")
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,#ffffff_0%,#eef6ff_45%,#edf8f1_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-4 gap-2 bg-primary/10 text-primary hover:bg-primary/10">
              <Bell className="h-3.5 w-3.5" />
              Opportunity radar
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Saved Searches</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Save searches like AI PhD Sweden paid and return later to see new matching thesis, PhD, and trainee opportunities.
            </p>
          </div>
          <Badge variant="outline" className="w-fit bg-white/80">
            {savedSearches.length} saved searches
          </Badge>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.3fr]">
        <Card>
          <CardContent className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Create Search</h2>
                <p className="text-xs text-muted-foreground">Combine keywords, type, field, location, and funding.</p>
              </div>
            </div>

            <form onSubmit={handleSaveSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search-title">Search name</Label>
                <Input
                  id="search-title"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="AI PhD Sweden paid"
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-keywords">Keywords</Label>
                <Input
                  id="search-keywords"
                  value={form.query}
                  onChange={(event) => setForm((current) => ({ ...current, query: event.target.value }))}
                  placeholder="AI, robotics, sustainability..."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Opportunity type</Label>
                  <Select value={form.opportunityType} onValueChange={(value) => setForm((current) => ({ ...current, opportunityType: value as SavedSearchType }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All opportunities</SelectItem>
                      <SelectItem value="master">Master thesis</SelectItem>
                      <SelectItem value="phd">PhD positions</SelectItem>
                      <SelectItem value="trainee">Trainee programs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Compensation</Label>
                  <Select value={form.compensation} onValueChange={(value) => setForm((current) => ({ ...current, compensation: value as Compensation | "any" }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="stipend">Stipend</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="search-field">Field</Label>
                  <Input
                    id="search-field"
                    value={form.field}
                    onChange={(event) => setForm((current) => ({ ...current, field: event.target.value }))}
                    placeholder="Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search-location">Location</Label>
                  <Input
                    id="search-location"
                    value={form.location}
                    onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                    placeholder="Sweden"
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving} className="w-full gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Save search
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex min-h-[360px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : savedSearches.length > 0 ? (
            savedSearches.map((savedSearch) => {
              const matches = searchResults.get(savedSearch.id) || []
              const newMatches = matches.filter((item) => new Date(item.createdAt) > new Date(savedSearch.createdAt))

              return (
                <Card key={savedSearch.id} className="border-border/70 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap gap-2">
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                            {savedSearch.opportunityType === "trainee" ? "Trainee" : savedSearch.opportunityType === "phd" ? "PhD" : savedSearch.opportunityType === "master" ? "Master" : "All"}
                          </Badge>
                          {newMatches.length > 0 && (
                            <Badge className="bg-[#34A853]/10 text-[#188038] hover:bg-[#34A853]/10">
                              <Sparkles className="mr-1 h-3 w-3" />
                              {newMatches.length} new
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-lg font-bold text-foreground">{savedSearch.title}</h2>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {savedSearch.query && <span>Keywords: {savedSearch.query}</span>}
                          {savedSearch.field && <span>Field: {savedSearch.field}</span>}
                          {savedSearch.location && <span>Location: {savedSearch.location}</span>}
                          {savedSearch.compensation && savedSearch.compensation !== "any" && <span>Funding: {savedSearch.compensation}</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(savedSearch.id)}
                        disabled={deletingId === savedSearch.id}
                        className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        {deletingId === savedSearch.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Delete
                      </Button>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <SearchMetric label="Total matches" value={matches.length} />
                      <SearchMetric label="New since saved" value={newMatches.length} />
                      <SearchMetric label="Deadline soon" value={matches.filter((item) => daysUntil(item.deadline) <= 14 && daysUntil(item.deadline) >= 0).length} />
                    </div>

                    <div className="mt-5 space-y-2">
                      {matches.slice(0, 3).map((item) => (
                        <Link key={`${item.kind}-${item.id}`} href={item.href} className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/25 p-3 transition-colors hover:bg-secondary">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                            {item.kind === "trainee" ? <Briefcase className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                            <p className="truncate text-xs text-muted-foreground">{item.organization} - {item.location}</p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {daysUntil(item.deadline)}d
                          </Badge>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </Link>
                      ))}
                      {matches.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                          No current matches. Keep it saved and check back later.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <Search className="mb-3 h-12 w-12 text-muted-foreground/30" />
                <h2 className="text-lg font-semibold text-foreground">No saved searches yet</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Create a search alert for your favorite field, country, and opportunity type.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function SearchMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/25 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function matchesSearch(item: MatchItem, savedSearch: SavedSearch) {
  if (savedSearch.opportunityType !== "all" && item.kind !== savedSearch.opportunityType) return false
  if (savedSearch.compensation && savedSearch.compensation !== "any" && item.compensation !== savedSearch.compensation) return false

  const haystack = `${item.title} ${item.description} ${item.organization} ${item.field} ${item.location}`.toLowerCase()
  const keywordTerms = savedSearch.query.toLowerCase().split(/[\s,]+/).filter(Boolean)
  const fieldTerms = (savedSearch.field || "").toLowerCase().split(/[\s,]+/).filter(Boolean)
  const location = (savedSearch.location || "").toLowerCase().trim()

  if (keywordTerms.length > 0 && !keywordTerms.some((term) => haystack.includes(term))) return false
  if (fieldTerms.length > 0 && !fieldTerms.some((term) => haystack.includes(term))) return false
  if (location && !item.location.toLowerCase().includes(location)) return false

  return true
}

function daysUntil(deadline: string) {
  return Math.ceil((new Date(deadline).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000)
}
