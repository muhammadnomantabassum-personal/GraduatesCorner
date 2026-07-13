"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { ExternalPhdCandidate } from "@/lib/external-phd-importer"
import { toNullableUuid } from "@/lib/uuid"
import {
  ArrowRight,
  CheckCircle2,
  DatabaseZap,
  ExternalLink,
  GraduationCap,
  Loader2,
  RefreshCw,
  Rss,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"

const feedPresets = [
  {
    name: "EURAXESS",
    description: "Paste an official EURAXESS RSS/API feed URL for PhD or doctoral jobs.",
  },
  {
    name: "FindAPhD",
    description: "Use an official FindAPhD alert/feed URL when available for your search.",
  },
  {
    name: "University feeds",
    description: "Works with university RSS/Atom job feeds and JSON Feed sources.",
  },
]

export default function AdminExternalImportsPage() {
  const { user, supabase } = useAuth()
  const [feedText, setFeedText] = useState("")
  const [candidates, setCandidates] = useState<ExternalPhdCandidate[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [existingUrls, setExistingUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)

  const feeds = useMemo(() =>
    feedText
      .split(/\r?\n|,/)
      .map((feed) => feed.trim())
      .filter(Boolean),
    [feedText]
  )

  const selectableCandidates = candidates.filter((candidate) => !existingUrls.includes(candidate.externalUrl))
  const selectedCandidates = candidates.filter((candidate) => selectedIds.includes(candidate.id))

  const handlePreview = async () => {
    if (feeds.length === 0) {
      toast.error("Add at least one RSS, Atom, or JSON feed URL")
      return
    }

    setLoading(true)
    setCandidates([])
    setSelectedIds([])
    setExistingUrls([])

    try {
      const response = await fetch("/api/admin/import-phd/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ feeds }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || "Import preview failed")
      }

      const nextCandidates = payload.candidates || []
      setCandidates(nextCandidates)
      setSelectedIds(nextCandidates.map((candidate: ExternalPhdCandidate) => candidate.id))

      const urls = nextCandidates.map((candidate: ExternalPhdCandidate) => candidate.externalUrl).filter(Boolean)
      if (urls.length > 0) {
        const { data } = await supabase
          .from("theses")
          .select("external_url")
          .in("external_url", urls)

        setExistingUrls((data || []).map((row: any) => row.external_url).filter(Boolean))
      }

      toast.success(`Found ${nextCandidates.length} PhD-style opportunities`)
    } catch (error: any) {
      toast.error("Unable to preview the external feed.")
    } finally {
      setLoading(false)
    }
  }

  const toggleCandidate = (candidateId: string) => {
    setSelectedIds((current) =>
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : [...current, candidateId]
    )
  }

  const handleImport = async () => {
    const toImport = selectedCandidates.filter((candidate) => !existingUrls.includes(candidate.externalUrl))

    if (toImport.length === 0) {
      toast.error("Select at least one new PhD position to import")
      return
    }

    setImporting(true)

    const response = await fetch("/api/admin/import-phd", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        candidates: toImport,
        adminUserId: toNullableUuid(user?.id),
      }),
    })
    const payload = await response.json().catch(() => ({}))

    setImporting(false)

    if (!response.ok) {
      toast.error(`Import failed: ${payload.error || "Unable to publish selected positions"}`)
      return
    }

    toast.success(`${payload.count || toImport.length} PhD positions imported and published`)
    setExistingUrls((current) => [...current, ...toImport.map((candidate) => candidate.externalUrl)])
    setSelectedIds([])
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,#ffffff_0%,#eef6ff_46%,#edf8f1_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-4 gap-2 bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/10">
              <DatabaseZap className="h-3.5 w-3.5" />
              External opportunity importer
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Import PhD Positions</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Bring PhD opportunities from official RSS, Atom, or JSON feeds into GraduatesCorner. Preview first, then publish selected positions.
            </p>
          </div>
          <Link href="/n_admin/dashboard/phd-positions">
            <Button variant="outline" className="gap-2">
              Manage PhD positions
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Rss className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Feed URLs</h2>
                  <p className="text-xs text-muted-foreground">One URL per line, or comma separated.</p>
                </div>
              </div>
              <Textarea
                value={feedText}
                onChange={(event) => setFeedText(event.target.value)}
                rows={8}
                className="mt-4"
                placeholder="https://example.com/phd-jobs.rss"
              />
              <Button onClick={handlePreview} disabled={loading} className="mt-4 w-full gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Preview Feed
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-foreground">Supported Sources</h2>
              <div className="mt-4 space-y-3">
                {feedPresets.map((preset) => (
                  <div key={preset.name} className="rounded-xl border border-border/70 bg-secondary/30 p-3">
                    <p className="text-sm font-semibold text-foreground">{preset.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{preset.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-[#FBBC04]/25 bg-[#FBBC04]/10 p-3 text-xs leading-relaxed text-[#7A4E00]">
                Use official feeds/APIs where possible. Avoid copying full copyrighted posts; imported descriptions link users back to the original source.
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Preview Results</h2>
                  <p className="text-xs text-muted-foreground">
                    {candidates.length} found, {selectableCandidates.length} new, {existingUrls.length} duplicate
                  </p>
                </div>
                <Button onClick={handleImport} disabled={importing || selectedCandidates.length === 0} className="gap-2">
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Publish selected
                </Button>
              </div>
            </CardContent>
          </Card>

          {candidates.length > 0 ? (
            <div className="space-y-3">
              {candidates.map((candidate) => {
                const duplicate = existingUrls.includes(candidate.externalUrl)
                const selected = selectedIds.includes(candidate.id)

                return (
                  <Card key={candidate.id} className={`border-l-[3px] ${duplicate ? "border-l-muted" : selected ? "border-l-[#1877F2]" : "border-l-border"}`}>
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap gap-2">
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                              <GraduationCap className="mr-1 h-3 w-3" />
                              PhD
                            </Badge>
                            <Badge variant="outline">{candidate.sourceName}</Badge>
                            {duplicate && <Badge variant="secondary">Already imported</Badge>}
                          </div>
                          <h3 className="text-sm font-semibold leading-snug text-foreground">{candidate.title}</h3>
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{candidate.description}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{candidate.organization}</span>
                            <span>{candidate.location}</span>
                            <span>Deadline {new Date(candidate.deadline).toLocaleDateString("en-GB")}</span>
                            <span>{candidate.subject}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <a href={candidate.externalUrl} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                              Source
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                          <Button
                            size="sm"
                            variant={selected ? "default" : "outline"}
                            disabled={duplicate}
                            onClick={() => toggleCandidate(candidate.id)}
                            className="h-8 gap-1.5 text-xs"
                          >
                            {selected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                            {selected ? "Selected" : "Select"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="mb-3 h-12 w-12 text-muted-foreground/30" />
                <h3 className="text-base font-semibold text-foreground">No feed preview yet</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Add an official source feed and preview it before publishing imported PhD positions.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-[#202124] text-white">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Automation Ready</h2>
                  <p className="mt-1 text-xs leading-relaxed text-white/65">
                    Daily auto-import is available through `/api/cron/import-phd` when `EXTERNAL_PHD_FEEDS` and `SUPABASE_SERVICE_ROLE_KEY` are configured in Vercel.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
