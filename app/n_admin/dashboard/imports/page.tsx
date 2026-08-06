"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import {
  Activity,
  CheckCheck,
  CheckCircle2,
  CircleAlert,
  Clock3,
  DatabaseZap,
  ExternalLink,
  GraduationCap,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Satellite,
  ShieldCheck,
  University,
  X,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type ImportSource = {
  id: string
  name: string
  organization: string
  country: string
  platform: "html" | "feed" | "sitemap" | "json" | "wordpress"
  public_url: string
  enabled: boolean
  auto_publish: boolean
  last_checked_at: string | null
  last_success_at: string | null
  consecutive_failures: number
  last_error: string | null
  scannable?: boolean
  access_note?: string | null
}

type ImportCandidate = {
  id: string
  title: string
  organization?: string
  company?: string
  location: string
  subject?: string
  field?: string
  duration?: string
  deadline: string
  published_at: string | null
  external_url: string
  status: "pending" | "ignored"
  first_seen_at: string
  source: { name: string; organization: string } | Array<{ name: string; organization: string }> | null
}

type ImportRun = {
  id: string
  status: "running" | "succeeded" | "partial" | "failed"
  started_at: string
  completed_at: string | null
  found_count: number
  new_count: number
  duplicate_count: number
  published_count: number
  error_count: number
  error_message: string | null
  source: { name: string } | Array<{ name: string }> | null
}

type ImportPayload = {
  sources: ImportSource[]
  candidates: ImportCandidate[]
  runs: ImportRun[]
  summary: {
    enabledSources: number
    pendingCandidates: number
    ignoredCandidates: number
    recentFailures: number
  }
}

type BulkPublishProgress = {
  attempted: number
  published: number
  total: number
}

type BulkPublishBatchResult = {
  attempted?: number
  published?: number
  failed?: Array<{ id: string; title: string }>
  nextCursor?: string | null
  hasMore?: boolean
  error?: string
}

const emptyPayload: ImportPayload = {
  sources: [],
  candidates: [],
  runs: [],
  summary: {
    enabledSources: 0,
    pendingCandidates: 0,
    ignoredCandidates: 0,
    recentFailures: 0,
  },
}

function relationName<T extends { name: string }>(relation: T | T[] | null) {
  return Array.isArray(relation) ? relation[0]?.name : relation?.name
}

function formatDate(value: string | null, includeTime = false) {
  if (!value) return "Never"
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value))
}

function sourceHealth(source: ImportSource) {
  if (source.scannable === false) return { label: "Permission required", className: "bg-[#FBBC04]/15 text-[#8A5A00]" }
  if (!source.enabled) return { label: "Paused", className: "bg-muted text-muted-foreground" }
  if (source.consecutive_failures > 0) {
    return { label: "Needs attention", className: "bg-[#EA4335]/10 text-[#C5221F]" }
  }
  if (source.last_success_at) return { label: "Healthy", className: "bg-[#34A853]/10 text-[#188038]" }
  return { label: "Ready", className: "bg-[#4285F4]/10 text-[#1967D2]" }
}

function runStatus(run: ImportRun) {
  if (run.status === "succeeded") return { label: "Succeeded", className: "bg-[#34A853]/10 text-[#188038]" }
  if (run.status === "partial") return { label: "Partial", className: "bg-[#FBBC04]/15 text-[#8A5A00]" }
  if (run.status === "failed") return { label: "Failed", className: "bg-[#EA4335]/10 text-[#C5221F]" }
  return { label: "Running", className: "bg-[#4285F4]/10 text-[#1967D2]" }
}

export default function AdminExternalImportsPage() {
  const pathname = usePathname()
  const isTrainee = pathname.includes("/trainee-imports")
  const apiPath = isTrainee ? "/api/admin/trainee-imports" : "/api/admin/phd-imports"
  const publicPath = isTrainee ? "/n_admin/dashboard/trainee-programs" : "/n_admin/dashboard/phd-positions"
  const opportunityLabelPlural = isTrainee ? "trainee programs" : "PhD positions"
  const [payload, setPayload] = useState<ImportPayload>(emptyPayload)
  const [loading, setLoading] = useState(true)
  const [activeAction, setActiveAction] = useState("")
  const [showIgnored, setShowIgnored] = useState(false)
  const [bulkPublishOpen, setBulkPublishOpen] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<BulkPublishProgress | null>(null)

  const loadImports = useCallback(async () => {
    const response = await fetch(apiPath, { cache: "no-store" })
    const result = await response.json().catch(() => null)
    if (!response.ok) throw new Error(result?.error || "Unable to load opportunity imports")
    setPayload(result)
  }, [apiPath])

  useEffect(() => {
    loadImports()
      .catch(() => toast.error(`Unable to load the ${isTrainee ? "trainee" : "university"} importer`))
      .finally(() => setLoading(false))
  }, [isTrainee, loadImports])

  const visibleCandidates = useMemo(
    () => payload.candidates.filter((candidate) => showIgnored ? candidate.status === "ignored" : candidate.status === "pending"),
    [payload.candidates, showIgnored]
  )

  const scanSources = async (sourceIds?: string[]) => {
    const actionId = sourceIds?.[0] ? `scan:${sourceIds[0]}` : "scan:all"
    setActiveAction(actionId)
    const response = await fetch(apiPath, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "scan", sourceIds }),
    })
    const result = await response.json().catch(() => null)
    setActiveAction("")

    if (!response.ok) {
      toast.error(result?.error || "Source scan failed")
      return
    }

    const totals = (result?.results || []).reduce(
      (summary: { added: number; found: number; errors: number }, run: { added: number; found: number; errors: number }) => ({
        added: summary.added + run.added,
        found: summary.found + run.found,
        errors: summary.errors + run.errors,
      }),
      { added: 0, found: 0, errors: 0 }
    )
    toast.success(`Scan complete: ${totals.added} new from ${totals.found} current ${opportunityLabelPlural}`)
    if (totals.errors) toast.warning(`${totals.errors} vacancy records need another check`)
    await loadImports()
  }

  const updateSource = async (
    source: ImportSource,
    update: { enabled?: boolean; autoPublish?: boolean }
  ) => {
    const actionId = `source:${source.id}`
    setActiveAction(actionId)
    const response = await fetch(apiPath, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceId: source.id, ...update }),
    })
    const result = await response.json().catch(() => null)
    setActiveAction("")

    if (!response.ok) {
      toast.error(result?.error || "Unable to update this source")
      return
    }

    setPayload((current) => ({
      ...current,
      sources: current.sources.map((item) => item.id === source.id ? result.source : item),
    }))
  }

  const updateCandidate = async (
    candidate: ImportCandidate,
    action: "publish" | "ignore" | "restore"
  ) => {
    const actionId = `${action}:${candidate.id}`
    setActiveAction(actionId)
    const response = await fetch(apiPath, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, candidateId: candidate.id }),
    })
    const result = await response.json().catch(() => null)
    setActiveAction("")

    if (!response.ok) {
      toast.error(result?.error || "Unable to update this candidate")
      return
    }

    toast.success(
      action === "publish"
        ? `${isTrainee ? "Trainee program" : "PhD position"} published`
        : action === "ignore"
          ? "Candidate moved to ignored"
          : "Candidate restored to review"
    )
    await loadImports()
  }

  const publishAllCandidates = async () => {
    const total = payload.summary.pendingCandidates
    let cursor: string | null = null
    let attempted = 0
    let published = 0
    let failed = 0

    setBulkPublishOpen(false)
    setActiveAction("publish:all")
    setBulkProgress({ attempted: 0, published: 0, total })

    try {
      do {
        const response: Response = await fetch(apiPath, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "publish-batch", cursor }),
        })
        const result = await response.json().catch(() => null) as BulkPublishBatchResult | null

        if (!response.ok) {
          throw new Error(result?.error || "Bulk publishing could not be completed")
        }

        attempted += Number(result?.attempted || 0)
        published += Number(result?.published || 0)
        failed += Array.isArray(result?.failed) ? result.failed.length : 0
        cursor = typeof result?.nextCursor === "string" ? result.nextCursor : null
        setBulkProgress({ attempted, published, total })

        if (!result?.hasMore || !cursor) break
      } while (true)

      if (failed > 0) {
        toast.warning(`${published} positions published; ${failed} still need individual review`)
      } else {
        toast.success(`${published} ${opportunityLabelPlural} published successfully`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk publishing stopped unexpectedly")
    } finally {
      await loadImports().catch(() => toast.error("Refresh the importer to see the latest queue"))
      setActiveAction("")
      setBulkProgress(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading source intelligence...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col gap-4 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-primary">
            <Satellite className="h-4 w-4" />
            {isTrainee ? "Graduate opportunity network" : "University source network"}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            {isTrainee ? "Trainee Import Operations" : "PhD Import Operations"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {isTrainee
              ? "Scan approved graduate-program sources, review newly discovered trainee opportunities, and publish individually or in one controlled batch."
              : "Monitor approved university career portals, review newly discovered PhD positions, and control publishing from one workspace."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="h-11 gap-2">
            <Link href={publicPath}>
              <GraduationCap className="h-4 w-4" />
              Published {isTrainee ? "programs" : "positions"}
            </Link>
          </Button>
          <Button
            onClick={() => scanSources()}
            disabled={Boolean(activeAction)}
            className="h-11 gap-2"
          >
            {activeAction === "scan:all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Scan enabled sources
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Importer summary">
        <MetricCard icon={University} label="Enabled sources" value={payload.summary.enabledSources} helper={`${payload.sources.length} registered sources`} tone="blue" />
        <MetricCard icon={DatabaseZap} label="Review queue" value={payload.summary.pendingCandidates} helper="New, unpublished positions" tone="green" />
        <MetricCard icon={Clock3} label="Ignored" value={payload.summary.ignoredCandidates} helper="Available for restoration" tone="yellow" />
        <MetricCard icon={CircleAlert} label="Recent failures" value={payload.summary.recentFailures} helper="Across the latest 40 runs" tone="red" />
      </section>

      <Tabs defaultValue="review" className="space-y-5">
        <TabsList className="h-auto w-full justify-start overflow-x-auto bg-secondary/70 p-1 sm:w-auto">
          <TabsTrigger value="review" className="min-h-10 gap-2">
            <ShieldCheck className="h-4 w-4" />
            Review queue
          </TabsTrigger>
          <TabsTrigger value="sources" className="min-h-10 gap-2">
            <University className="h-4 w-4" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="activity" className="min-h-10 gap-2">
            <Activity className="h-4 w-4" />
            Run history
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{showIgnored ? "Ignored candidates" : "Ready for review"}</h2>
              <p className="text-sm text-muted-foreground">
                {showIgnored ? "Restore a candidate when it should return to the publishing queue." : "Nothing is public until you approve it, unless its source has auto-publish enabled."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!showIgnored && payload.summary.pendingCandidates > 0 && (
                <Button
                  onClick={() => setBulkPublishOpen(true)}
                  disabled={Boolean(activeAction)}
                  className="h-10 gap-2"
                >
                  {activeAction === "publish:all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                  Publish all ({payload.summary.pendingCandidates})
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowIgnored((current) => !current)} disabled={Boolean(activeAction)} className="h-10 gap-2">
                {showIgnored ? <ShieldCheck className="h-4 w-4" /> : <X className="h-4 w-4" />}
                {showIgnored ? "Show review queue" : "Show ignored"}
              </Button>
            </div>
          </div>

          {bulkProgress && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-4" role="status" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="inline-flex items-center gap-2 font-medium text-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Publishing approved positions
                </span>
                <span className="text-muted-foreground">
                  {bulkProgress.attempted} of {bulkProgress.total} reviewed
                </span>
              </div>
              <Progress
                value={bulkProgress.total > 0 ? (bulkProgress.attempted / bulkProgress.total) * 100 : 0}
                className="mt-3 h-2"
              />
            </div>
          )}

          {visibleCandidates.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {visibleCandidates.map((candidate) => (
                <Card key={candidate.id} className="border-border/75 shadow-sm">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-[#34A853]/10 text-[#188038] hover:bg-[#34A853]/10">{isTrainee ? "Trainee" : "PhD"}</Badge>
                      <Badge variant="outline">{relationName(candidate.source) || candidate.organization || candidate.company}</Badge>
                      <span className="ml-auto text-xs text-muted-foreground">Found {formatDate(candidate.first_seen_at)}</span>
                    </div>
                    <h3 className="mt-4 text-base font-semibold leading-6 text-foreground">{candidate.title}</h3>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <span>{candidate.location}</span>
                      <span>{candidate.subject || candidate.field}</span>
                      <span>Deadline {formatDate(candidate.deadline)}</span>
                      <span>{candidate.duration || (candidate.published_at ? `Published ${formatDate(candidate.published_at)}` : "Publication date not supplied")}</span>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                      <Button variant="outline" size="sm" asChild className="h-10 gap-2">
                        <a href={candidate.external_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Official source
                        </a>
                      </Button>
                      {candidate.status === "ignored" ? (
                        <Button
                          size="sm"
                          className="h-10 gap-2"
                          disabled={Boolean(activeAction)}
                          onClick={() => updateCandidate(candidate, "restore")}
                        >
                          {activeAction === `restore:${candidate.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                          Restore
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 gap-2 text-muted-foreground"
                            disabled={Boolean(activeAction)}
                            onClick={() => updateCandidate(candidate, "ignore")}
                          >
                            {activeAction === `ignore:${candidate.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                            Ignore
                          </Button>
                          <Button
                            size="sm"
                            className="h-10 gap-2"
                            disabled={Boolean(activeAction)}
                            onClick={() => updateCandidate(candidate, "publish")}
                          >
                            {activeAction === `publish:${candidate.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Publish
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={showIgnored ? RotateCcw : ShieldCheck}
              title={showIgnored ? "No ignored candidates" : "The review queue is clear"}
              description={showIgnored ? "Candidates you ignore will remain available here." : `Run a source scan to check for newly published ${opportunityLabelPlural}.`}
            />
          )}
        </TabsContent>

        <TabsContent value="sources">
          <div className="grid gap-4 lg:grid-cols-2">
            {payload.sources.map((source) => {
              const health = sourceHealth(source)
              const busy = activeAction === `source:${source.id}` || activeAction === `scan:${source.id}`
              return (
                <Card key={source.id} className="border-border/75 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <University className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{source.organization}</h3>
                          <Badge className={health.className}>{health.label}</Badge>
                          <Badge variant="outline" className="uppercase">{source.platform}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Last checked {formatDate(source.last_checked_at, true)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        title={`Scan ${source.organization}`}
                        disabled={Boolean(activeAction) || source.scannable === false}
                        onClick={() => scanSources([source.id])}
                      >
                        {activeAction === `scan:${source.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        <span className="sr-only">Scan {source.organization}</span>
                      </Button>
                    </div>

                    {(source.access_note || source.last_error) && (
                      <div className="mt-4 rounded-md border border-[#EA4335]/20 bg-[#EA4335]/5 p-3 text-xs leading-5 text-[#A50E0E]">
                        {source.access_note || source.last_error}
                      </div>
                    )}

                    <div className="mt-5 grid gap-4 border-t border-border/70 pt-4 sm:grid-cols-2">
                      <label className="flex min-h-11 items-center justify-between gap-3">
                        <span>
                          <span className="block text-sm font-medium text-foreground">Scheduled scans</span>
                          <span className="block text-xs text-muted-foreground">Include in the daily run</span>
                        </span>
                        <Switch
                          checked={source.enabled}
                          disabled={busy || source.scannable === false}
                          onCheckedChange={(enabled) => updateSource(source, { enabled })}
                          aria-label={`Enable scheduled scans for ${source.organization}`}
                        />
                      </label>
                      <label className="flex min-h-11 items-center justify-between gap-3">
                        <span>
                          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            Auto-publish
                            <Zap className="h-3.5 w-3.5 text-[#FBBC04]" />
                          </span>
                          <span className="block text-xs text-muted-foreground">Skip manual approval</span>
                        </span>
                        <Switch
                          checked={source.auto_publish}
                          disabled={busy || !source.enabled || source.scannable === false}
                          onCheckedChange={(autoPublish) => updateSource(source, { autoPublish })}
                          aria-label={`Auto-publish positions from ${source.organization}`}
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4 text-xs">
                      <span className="text-muted-foreground">
                        {source.last_success_at ? `Last successful scan ${formatDate(source.last_success_at, true)}` : "Awaiting first successful scan"}
                      </span>
                      <a href={source.public_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 font-medium text-primary hover:underline">
                        Source page
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          {payload.runs.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Source</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Started</th>
                      <th className="px-4 py-3 text-right font-semibold">Found</th>
                      <th className="px-4 py-3 text-right font-semibold">New</th>
                      <th className="px-4 py-3 text-right font-semibold">Duplicates</th>
                      <th className="px-4 py-3 text-right font-semibold">Published</th>
                      <th className="px-4 py-3 text-right font-semibold">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payload.runs.map((run) => {
                      const status = runStatus(run)
                      return (
                        <tr key={run.id} className="hover:bg-secondary/25">
                          <td className="px-4 py-3 font-medium text-foreground">{relationName(run.source) || "Import source"}</td>
                          <td className="px-4 py-3"><Badge className={status.className}>{status.label}</Badge></td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(run.started_at, true)}</td>
                          <td className="px-4 py-3 text-right">{run.found_count}</td>
                          <td className="px-4 py-3 text-right font-medium text-[#188038]">{run.new_count}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{run.duplicate_count}</td>
                          <td className="px-4 py-3 text-right">{run.published_count}</td>
                          <td className="px-4 py-3 text-right text-[#C5221F]">{run.error_count}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState icon={Activity} title="No import runs yet" description="Run an enabled source scan to create the first activity record." />
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={bulkPublishOpen} onOpenChange={setBulkPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish every position in the review queue?</AlertDialogTitle>
            <AlertDialogDescription className="leading-6">
              This will publish all {payload.summary.pendingCandidates} pending {opportunityLabelPlural} to the public website. Duplicate checks still run for every record, but you should only continue when the imported content is ready for visitors.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void publishAllCandidates()} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Publish all positions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: typeof University
  label: string
  value: number
  helper: string
  tone: "blue" | "green" | "yellow" | "red"
}) {
  const tones = {
    blue: "bg-[#4285F4]/10 text-[#1967D2]",
    green: "bg-[#34A853]/10 text-[#188038]",
    yellow: "bg-[#FBBC04]/15 text-[#8A5A00]",
    red: "bg-[#EA4335]/10 text-[#C5221F]",
  }

  return (
    <Card className="border-border/75 shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="truncate text-xs text-muted-foreground">{helper}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof University
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-md border border-dashed border-border bg-secondary/20 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}
