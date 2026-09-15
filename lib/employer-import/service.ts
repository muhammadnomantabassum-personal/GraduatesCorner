import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { EMPLOYER_SOURCES, getEmployerSource } from "./catalogue"
import { canonicalJobUrl } from "./identity"
import { readEmployerCandidate, scanEmployerPage } from "./parser"
import type { EmployerCursor } from "./types"

export async function syncEmployerSources(db: SupabaseClient) {
  const { error } = await db.from("employer_import_sources").upsert(EMPLOYER_SOURCES.map(source => ({ id: source.id })), { onConflict: "id", ignoreDuplicates: true })
  if (error) throw error
}

async function knownJobs(db: SupabaseClient) {
  const known = new Set<string>()
  for (const table of ["employer_import_items", "theses", "trainee_programs"] as const) {
    for (let offset = 0; ; offset += 1000) {
      const fields = table === "employer_import_items" ? "id,canonical_url,source_id,external_id" : "id,external_url,external_id,employer_import_key"
      const { data, error } = await db.from(table).select(fields).order("id").range(offset, offset + 999)
      if (error) throw error
      for (const record of (data || []) as unknown as Record<string, string>[]) {
        const url = record.canonical_url || record.external_url
        if (url) { try { known.add(canonicalJobUrl(url)) } catch { /* Legacy malformed URL. */ } }
        if (record.source_id) known.add(`${record.source_id}:${record.external_id}`)
        if (record.employer_import_key) known.add(record.employer_import_key)
      }
      if (!data || data.length < 1000) break
    }
  }
  return known
}

export async function scanEmployer(db: SupabaseClient, sourceId: string, section?: "master" | "trainee") {
  const source = getEmployerSource(sourceId)
  if (!source || source.note) throw new Error(source?.note || "Unknown employer source")
  const { data: token, error: lockError } = await db.rpc("claim_employer_import", { source_key: sourceId })
  if (lockError) throw lockError
  if (!token) throw new Error("This source is already scanning. Please wait for the current scan to finish.")
  let runId: string | undefined
  try {
    const { data: setting, error } = await db.from("employer_import_sources").select("cursor,auto_publish").eq("id", sourceId).single()
    if (error) throw error
    const { data: run, error: runError } = await db.from("employer_import_runs").insert({ source_id: sourceId }).select("id").single()
    if (runError) throw runError
    runId = run.id
    const result = await scanEmployerPage(source, setting.cursor as EmployerCursor, await knownJobs(db), section)
    let added = 0
    let duplicates = result.duplicates
    let published = 0
    for (const candidate of result.candidates) {
      const { data, error: insertError } = await db.from("employer_import_items").insert({
        source_id: sourceId, external_id: candidate.externalId, canonical_url: candidate.url,
        title: candidate.title, kind: candidate.kind, organization: candidate.organization,
        location: candidate.location, description: candidate.description, field: candidate.field,
        deadline: candidate.deadline, compensation: candidate.compensation, duration: candidate.duration, published_at: candidate.publishedAt,
        deadline_type: candidate.deadlineType, availability_state: candidate.activeConfirmed ? "active" : "unknown",
        availability_checked_at: candidate.activeConfirmed ? new Date().toISOString() : null,
        next_check_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      }).select("id").single()
      if (insertError?.code === "23505") { duplicates++; continue }
      if (insertError) throw insertError
      added++
      if (setting.auto_publish && candidate.activeConfirmed) {
        const { error: publishError } = await db.rpc("publish_employer_candidate", { candidate_id: data.id })
        if (publishError) result.errors.push("Candidate saved for review because automatic publication failed")
        else published++
      }
    }
    const summary = { status: result.errors.length ? "partial" : "succeeded", found: result.found, added, duplicates, published, excluded: result.excluded, completed_at: new Date().toISOString(), error_message: result.errors.length ? [...new Set(result.errors)].join("; ").slice(0, 1200) : null }
    const { error: summaryError } = await db.from("employer_import_runs").update(summary).eq("id", runId)
    if (summaryError) throw summaryError
    const { error: settingError } = await db.from("employer_import_sources").update({ cursor: result.cursor, last_checked_at: summary.completed_at, last_success_at: summary.completed_at, last_error: summary.error_message }).eq("id", sourceId).eq("lock_token", token)
    if (settingError) throw settingError
    return summary
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1200) : "Employer import failed"
    if (runId) await db.from("employer_import_runs").update({ status: "failed", error_message: message, completed_at: new Date().toISOString() }).eq("id", runId)
    await db.from("employer_import_sources").update({ last_checked_at: new Date().toISOString(), last_error: message }).eq("id", sourceId).eq("lock_token", token)
    throw new Error(message)
  } finally {
    await db.from("employer_import_sources").update({ lock_token: null, lock_until: null }).eq("id", sourceId).eq("lock_token", token)
  }
}

/** Each check holds a database lease so cron and admin actions cannot overwrite each other. */
async function checkClaimedEmployerImport(db: SupabaseClient, row: Record<string, any>) {
  let candidate: Awaited<ReturnType<typeof readEmployerCandidate>> = null
  let outcome: "active" | "closed" | "failed" = "failed"
  let reason = "Unable to confirm that the original vacancy is active"
  try {
    const source = getEmployerSource(row.source_id)
    if (!source || source.note) throw new Error("Source is no longer available")
    candidate = await readEmployerCandidate(source, { id: row.external_id, url: row.canonical_url, title: row.title })
    if (!candidate) { outcome = "closed"; reason = "Position is closed or no longer matches" }
    else if (candidate.activeConfirmed) { outcome = "active"; reason = "Original vacancy confirmed active" }
  } catch (error) {
    reason = error instanceof Error ? error.message : "Source unavailable"
    // A missing robots file is handled separately by the guarded fetcher. Only vacancy 404/410 closes a job.
    if (/status (404|410)\b/.test(reason)) outcome = "closed"
  }
  const metadata = candidate && outcome === "active" ? {
    deadline: candidate.deadline, deadline_type: candidate.deadlineType, compensation: candidate.compensation,
    description: candidate.description, location: candidate.location, organization: candidate.organization,
  } : {}
  const { error } = await db.rpc("finish_employer_availability", { candidate_id: row.id, token: row.check_token, outcome, metadata, detail: reason })
  if (error) throw new Error("Unable to save vacancy availability")
  return { ready: outcome === "active", reason, row: { ...row, ...metadata } }
}

export async function refreshEmployerImport(db: SupabaseClient, candidateId: string) {
  const { data: row, error } = await db.from("employer_import_items").select("*").eq("id", candidateId).single()
  if (error || !row) throw new Error("Candidate not found")
  if (row.status !== "pending") return { ready: false, reason: "Position is no longer pending", row }
  const { data, error: lockError } = await db.rpc("claim_employer_availability", { candidate_id: candidateId })
  if (lockError) throw new Error("Availability checks need the database update")
  if (!data?.[0]) throw new Error("This vacancy is already being checked. Try again shortly.")
  return checkClaimedEmployerImport(db, data[0])
}

export async function recheckEmployerAvailability(db: SupabaseClient, budgetMs = 200_000) {
  const started = Date.now()
  const results = { checked: 0, active: 0, unavailable: 0 }
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (Date.now() - started < budgetMs) {
      const { data, error } = await db.rpc("claim_employer_availability", {})
      if (error) throw error
      if (!data?.[0]) break
      const result = await checkClaimedEmployerImport(db, data[0])
      results.checked++
      if (result.ready) results.active++; else results.unavailable++
    }
  }))
  return results
}

export async function publishEmployerImport(db: SupabaseClient, candidateId: string) {
  const result = await refreshEmployerImport(db, candidateId)
  if (result.row.status === "published" || result.row.status === "duplicate") return result.row.thesis_id || result.row.program_id
  if (!result.ready) throw new Error(result.reason)
  const { data, error } = await db.rpc("publish_employer_candidate", { candidate_id: candidateId })
  if (error) throw new Error("Publication failed. Check that the automatic metadata database update has been applied.")
  return data
}

export async function processEmployerImportBatch(db: SupabaseClient, section: "master" | "trainee", cursor: string | null, publish: boolean) {
  // Keyset pagination moves past closed vacancies and failed sources, even when publishing removes rows.
  let query = db.from("employer_import_items").select("id,title").eq("status", "pending").in("kind", section === "master" ? ["master_thesis", "internship"] : ["trainee"]).order("id").limit(5)
  if (cursor) query = query.gt("id", cursor)
  const { data, error } = await query
  if (error) throw new Error("Unable to load pending imports")
  const rows = (data || []).slice(0, 4)
  let published = 0; let refreshed = 0
  const skipped: { id: string; title: string; reason: string }[] = []
  let index = 0
  await Promise.all(Array.from({ length: Math.min(2, rows.length) }, async () => {
    while (index < rows.length) {
      const row = rows[index++]
      try {
        if (publish) { await publishEmployerImport(db, row.id); published++ }
        else { const result = await refreshEmployerImport(db, row.id); if (!result.ready) skipped.push({ ...row, reason: result.reason }) }
        refreshed++
      } catch (error) { skipped.push({ ...row, reason: error instanceof Error ? error.message : "Source unavailable" }) }
    }
  }))
  return { attempted: rows.length, refreshed, published, skipped, hasMore: (data?.length || 0) > 4, nextCursor: rows.at(-1)?.id || null }
}
