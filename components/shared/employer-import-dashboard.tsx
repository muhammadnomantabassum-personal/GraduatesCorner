"use client"
import { deadlineLabel } from "@/lib/opportunity-deadline"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import type { EmployerSource } from "@/lib/employer-import/catalogue"

type Source = EmployerSource & { enabled: boolean; auto_publish: boolean; cursor: { query: number; offset: number }; last_error: string | null; last_checked_at: string | null }
type Candidate = { id: string; title: string; kind: string; canonical_url: string; organization: string; location: string; description: string; deadline: string | null; deadline_type: string; availability_state: string; availability_checked_at: string | null; availability_error: string | null; compensation: string | null; status: string }
type Run = { id: string; source_id: string; status: string; found: number; added: number; duplicates: number; excluded: number; error_message: string | null }
const endpoint = "/api/admin/employer-imports"

export function EmployerImportDashboard({ section }: { section: "master" | "trainee" }) {
  const [sources, setSources] = useState<Source[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [ignored, setIgnored] = useState(false)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("")
  const [progress, setProgress] = useState("")
  const [skipped, setSkipped] = useState<Array<{ id: string; title: string; reason: string }>>([])
  const load = useCallback(async () => {
    const response = await fetch(`${endpoint}?section=${section}&page=${page}&status=${ignored ? "ignored" : "pending"}`, { cache: "no-store" })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    setSources(data.sources); setCandidates(data.candidates); setRuns(data.runs); setTotal(data.total); setError("")
  }, [section, page, ignored])
  useEffect(() => { load().catch(error => setError(error.message)) }, [load])
  async function send(body: Record<string, unknown>) {
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, section }) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    return data
  }
  async function action(body: Record<string, unknown>, label: string) {
    setBusy(label)
    try { const data = await send(body); await load(); toast.success(body.action === "scan" ? `Added ${data.added}; skipped ${data.duplicates} duplicates` : "Updated"); if (data.error_message) toast.warning(data.error_message) }
    catch (error) { toast.error(error instanceof Error ? error.message : "Operation failed") }
    finally { setBusy("") }
  }
  async function scanSources(verifiedOnly = false) {
    const selected = sources.filter(source => (verifiedOnly ? source.verified : source.enabled) && !source.note)
    setBusy("all")
    let completed = 0
    let index = 0
    let failures = 0
    try {
      await Promise.all(Array.from({ length: Math.min(2, selected.length) }, async () => {
        while (index < selected.length) {
          const source = selected[index++]
          try { const result = await send({ action: "scan", sourceId: source.id }); if (result.status === "partial") failures++ } catch { failures++ }
          completed++; setProgress(`Scanned ${completed}/${selected.length} sources${failures ? `; ${failures} need attention` : ""}`)
        }
      }))
      await load()
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to refresh") }
    finally { setBusy("") }
  }
  async function processPending(publish: boolean) {
    setBusy(publish ? "Publishing pending positions" : "Fetching deadlines")
    setSkipped([]); setProgress("Fetching current vacancy details…")
    let cursor: string | null = null
    let attempted = 0; let published = 0; let skippedCount = 0
    try {
      while (true) {
        const result = await send({ action: publish ? "publish-batch" : "refresh-batch", cursor })
        attempted += result.attempted; published += result.published; skippedCount += result.skipped.length
        setSkipped(previous => [...previous, ...result.skipped])
        setProgress(`Checked ${attempted} positions${publish ? `; ${published} published` : ""}; ${skippedCount} skipped`)
        if (!result.hasMore) break
        if (!result.nextCursor || result.nextCursor === cursor) throw new Error("Import batch did not advance")
        cursor = result.nextCursor
      }
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : "Batch failed") }
    finally { setBusy("") }
  }
  return <div className="mx-auto max-w-7xl space-y-8">
    <div className="space-y-3"><h1 className="text-3xl font-bold">{section === "master" ? "Thesis & Internship Imports" : "Employer Trainee Imports"}</h1>
      <p className="max-w-3xl text-muted-foreground">Scan company career feeds, review new positions, and publish them to {section === "master" ? "Master’s Thesis & Internships" : "Trainee Programs"}. Previously imported and ignored positions are remembered. Each scan continues the next search page; repeat scans cover more pages and search terms.</p>
      <div className="flex flex-wrap gap-4 text-sm underline"><Link href={section === "master" ? "/n_admin/dashboard/employer-program-imports" : "/n_admin/dashboard/thesis-imports"}>Switch to {section === "master" ? "trainee" : "thesis & internship"} review</Link><Link href={section === "master" ? "/master-thesis" : "/trainee-programs"}>View public listings</Link><Link href="/n_admin/dashboard/trainee-imports">Existing trainee directory imports</Link></div>
    </div>
    {error && <p role="alert" className="rounded border border-destructive p-4 text-destructive">{error}</p>}
    <section className="space-y-4"><div className="flex flex-wrap items-center gap-3"><h2 className="mr-auto text-xl font-semibold">Sources ({sources.length})</h2><Button disabled={!!busy || !sources.some(source => source.verified && !source.note)} onClick={() => scanSources(true)}>Import from verified sources</Button><Button variant="outline" disabled={!!busy || !sources.some(source => source.enabled && !source.note)} onClick={() => scanSources()}>Scan enabled sources</Button></div>
      <p className="text-sm text-muted-foreground">Scans here search for {section === "trainee" ? "trainee and graduate programs" : "theses and internships"}. Deadlines are fetched from the source. Automatic publishing requires a confirmed active vacancy. Missing deadlines and compensation stay unspecified.</p>
      <p role="status">{busy ? progress || `Working: ${busy}` : progress}</p>
      <Input aria-label="Filter employers or countries" placeholder="Filter employer, country, or ATS…" value={filter} onChange={event => setFilter(event.target.value)} />
      <div className="max-h-[540px] space-y-3 overflow-y-auto rounded-xl border p-3">{sources.filter(source => `${source.name} ${source.country} ${source.adapter}`.toLowerCase().includes(filter.toLowerCase())).map(source => <div key={source.id} className="flex flex-wrap items-center gap-4 rounded-lg border p-4">
        <div className="min-w-48 flex-1"><a className="font-semibold underline" href={source.publicUrl} target="_blank" rel="noopener noreferrer">{source.name}</a><p className="text-sm text-muted-foreground">{source.country} · {source.adapter} · {source.verified ? "Endpoint configured" : "Discovery / needs verification"}</p><p className="text-xs">Search {source.cursor?.query + 1 || 1}, offset {source.cursor?.offset || 0}</p>{(source.note || source.last_error) && <p className="mt-1 max-w-lg text-sm text-amber-700">{source.note || source.last_error}</p>}</div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={source.enabled} disabled={!!busy || !!source.note} onChange={event => action({ action: "settings", sourceId: source.id, enabled: event.target.checked }, source.name)} />Enabled</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={source.auto_publish} disabled={!!busy || !!source.note} onChange={event => action({ action: "settings", sourceId: source.id, autoPublish: event.target.checked }, source.name)} />Auto-publish active listings</label>
        <Button variant="outline" disabled={!!busy || !!source.note} onClick={() => action({ action: "scan", sourceId: source.id }, source.name)}>Scan next page</Button>
      </div>)}</div>
    </section>
    <section className="space-y-4"><div className="flex flex-wrap items-center gap-4"><h2 className="text-xl font-semibold">{ignored ? "Ignored" : "Review queue"} ({total})</h2><Button variant="outline" disabled={!!busy} onClick={() => { setIgnored(!ignored); setPage(0) }}>{ignored ? "Show pending" : "Show ignored"}</Button></div>
      <p className="text-sm text-muted-foreground">Fetch deadlines for existing imports, or publish all pending positions in one action. Active positions without a stated deadline can be published. Sources are rechecked automatically when their 48-hour check is due; closed positions are archived, and three failed checks temporarily hide a listing.</p>
      {!ignored && <div className="flex flex-wrap gap-3"><Button disabled={!!busy || !total} onClick={() => processPending(true)}>Check sources &amp; publish all</Button><Button variant="outline" disabled={!!busy || !total} onClick={() => processPending(false)}>Refresh availability &amp; deadlines</Button></div>}
      {skipped.length > 0 && <details><summary className="cursor-pointer text-sm">Skipped positions ({skipped.length})</summary><ul className="mt-2 space-y-1 text-sm">{skipped.map(item => <li key={item.id}>{item.title}: {item.reason}</li>)}</ul></details>}
      {candidates.map(candidate => <CandidateReview key={candidate.id} candidate={candidate} disabled={!!busy} onAction={body => action(body, candidate.title)} />)}
      {!candidates.length && <p className="rounded border p-6 text-muted-foreground">No positions in this queue. Scan a source or continue its next page.</p>}
      <div className="flex items-center gap-3"><Button variant="outline" disabled={page === 0 || !!busy} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page + 1}</span><Button variant="outline" disabled={(page + 1) * 30 >= total || !!busy} onClick={() => setPage(page + 1)}>Next</Button></div>
    </section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Recent scans</h2>{runs.map(run => <div key={run.id} className="rounded border p-3 text-sm"><strong>{sources.find(source => source.id === run.source_id)?.name || run.source_id}</strong> · {run.status} · {run.added} new · {run.duplicates} duplicates skipped · {run.excluded} nonmatching/closed{run.error_message && <p className="mt-1 text-amber-700">{run.error_message}</p>}</div>)}</section>
  </div>
}

function CandidateReview({ candidate, disabled, onAction }: { candidate: Candidate; disabled: boolean; onAction: (body: Record<string, unknown>) => void }) {
  return <article className="space-y-3 rounded-xl border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-xs uppercase text-muted-foreground">{candidate.kind.replaceAll("_", " ")}</span><h3 className="font-semibold">{candidate.title}</h3><p className="text-sm">{candidate.organization} · {candidate.location}</p></div><a className="text-sm underline" href={candidate.canonical_url} target="_blank" rel="noopener noreferrer">Original vacancy ↗</a></div>
    <details><summary className="cursor-pointer text-sm">Read imported description</summary><p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{candidate.description}</p></details>
    {candidate.status === "ignored" ? <Button disabled={disabled} variant="outline" onClick={() => onAction({ action: "restore", candidateId: candidate.id })}>Restore to review</Button> : <>
      <div className="flex flex-wrap gap-4 text-sm"><span>Deadline: {deadlineLabel(candidate.deadline, candidate.deadline_type)}</span><span>Compensation: {candidate.compensation || "Not specified"}</span></div>
      <p className="text-xs text-muted-foreground">Source: {candidate.availability_state || "Not checked"}{candidate.availability_checked_at && ` | Last checked ${new Date(candidate.availability_checked_at).toLocaleString("en-GB")}`}{candidate.availability_error && ` | ${candidate.availability_error}`}</p>
      <div className="flex flex-wrap gap-2"><Button disabled={disabled} onClick={() => onAction({ action: "publish", candidateId: candidate.id })}>Fetch details &amp; publish</Button><Button variant="outline" disabled={disabled} onClick={() => onAction({ action: "refresh", candidateId: candidate.id })}>Refresh source details</Button><Button variant="outline" disabled={disabled} onClick={() => onAction({ action: "ignore", candidateId: candidate.id })}>Ignore</Button></div>
    </>}
  </article>
}
