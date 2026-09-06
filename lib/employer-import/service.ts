import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { EMPLOYER_SOURCES, getEmployerSource } from "./catalogue"
import { canonicalJobUrl } from "./identity"
import { scanEmployerPage } from "./parser"
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
      }).select("id").single()
      if (insertError?.code === "23505") { duplicates++; continue }
      if (insertError) throw insertError
      added++
      if (setting.auto_publish && candidate.deadline && candidate.compensation) {
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
