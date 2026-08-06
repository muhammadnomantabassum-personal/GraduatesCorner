import "server-only"

import { createHash } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  findExistingTraineeMatch,
  type ExistingTraineeIdentity,
  type TraineeIdentityMatch,
} from "./dedupe"
import { scrapeTraineeProgramSource } from "./parser"
import { getTraineeImportSources } from "./sources"
import type {
  TraineeImportCandidate,
  TraineeImportRunResult,
  TraineeSourceDatabaseRow,
} from "./types"

type ImportOptions = {
  sourceIds?: string[]
  includeDisabled?: boolean
}

const SOURCE_CONCURRENCY = 2
const BULK_PUBLISH_CONCURRENCY = 4
const BULK_PUBLISH_BATCH_SIZE = 40
const EXISTING_PROGRAM_PAGE_SIZE = 1_000

const IMPORT_CANDIDATE_SELECT = `
  id, external_id, external_url, title, company, location, field,
  description, duration, compensation, deadline, published_at, source_id,
  source_metadata, status, program_id,
  source:trainee_import_sources(name)
`

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown import error"
}

function fingerprint(candidate: TraineeImportCandidate) {
  return createHash("sha256")
    .update(`${candidate.sourceId}:${candidate.externalId}:${candidate.externalUrl}`)
    .digest("hex")
}

function matchReviewNote(match: TraineeIdentityMatch) {
  const reason = {
    external_url: "official URL",
    external_id: "source vacancy ID",
    title_company_deadline: "title, company, and deadline",
  }[match.reason]
  return `Matched an existing trainee program by ${reason}; no duplicate was created.`
}

async function loadExistingPrograms(adminClient: SupabaseClient) {
  const rows: ExistingTraineeIdentity[] = []
  for (let from = 0; ; from += EXISTING_PROGRAM_PAGE_SIZE) {
    const { data, error } = await adminClient
      .from("trainee_programs")
      .select("id, title, company, deadline, external_url, external_id, status")
      .order("id", { ascending: true })
      .range(from, from + EXISTING_PROGRAM_PAGE_SIZE - 1)
    if (error) throw error
    const page = (data || []) as ExistingTraineeIdentity[]
    rows.push(...page)
    if (page.length < EXISTING_PROGRAM_PAGE_SIZE) break
  }
  return rows
}

function programRow(candidate: TraineeImportCandidate, status: "approved" | "pending") {
  return {
    title: candidate.title,
    company: candidate.company,
    description: candidate.description,
    field: candidate.field,
    location: candidate.location,
    duration: candidate.duration,
    compensation: candidate.compensation,
    deadline: candidate.deadline,
    external_url: candidate.externalUrl,
    external_id: candidate.externalId,
    source_name: candidate.sourceName,
    source_published_at: candidate.publishedAt,
    last_synced_at: new Date().toISOString(),
    posted_by: "admin",
    posted_by_user_id: null,
    status,
  }
}

async function publishCandidateRow(
  adminClient: SupabaseClient,
  candidate: TraineeImportCandidate,
  importItemId: string,
  existingPrograms?: ExistingTraineeIdentity[]
) {
  const knownPrograms = existingPrograms || await loadExistingPrograms(adminClient)
  let match = findExistingTraineeMatch(candidate, knownPrograms)
  let programId = match?.program.id

  if (!programId) {
    const { data: created, error: createError } = await adminClient
      .from("trainee_programs")
      .insert(programRow(candidate, "approved"))
      .select("id")
      .single()

    if (createError?.code === "23505") {
      const refreshed = await loadExistingPrograms(adminClient)
      match = findExistingTraineeMatch(candidate, refreshed)
      programId = match?.program.id
    } else if (createError) {
      throw createError
    } else {
      programId = created.id as string
      knownPrograms.push({
        id: programId,
        title: candidate.title,
        company: candidate.company,
        deadline: candidate.deadline,
        external_url: candidate.externalUrl,
        external_id: candidate.externalId,
        status: "approved",
      })
    }
  }

  if (!programId) throw new Error("Could not publish or match the imported trainee program.")

  const { error: updateError } = await adminClient
    .from("trainee_import_items")
    .update({
      status: "published",
      program_id: programId,
      reviewed_at: new Date().toISOString(),
      review_note: match ? matchReviewNote(match) : "Published by the trainee program importer.",
    })
    .eq("id", importItemId)
  if (updateError) throw updateError
  return programId
}

async function recordCandidate(
  adminClient: SupabaseClient,
  candidate: TraineeImportCandidate,
  runId: string,
  autoPublish: boolean,
  existingPrograms: ExistingTraineeIdentity[]
) {
  const now = new Date().toISOString()
  const candidateFields = {
    run_id: runId,
    external_url: candidate.externalUrl,
    fingerprint: fingerprint(candidate),
    title: candidate.title,
    company: candidate.company,
    location: candidate.location,
    field: candidate.field,
    description: candidate.description,
    duration: candidate.duration,
    compensation: candidate.compensation,
    deadline: candidate.deadline,
    published_at: candidate.publishedAt,
    source_metadata: candidate.sourceMetadata,
    last_seen_at: now,
  }
  const match = findExistingTraineeMatch(candidate, existingPrograms)

  const { data: currentItem, error: currentItemError } = await adminClient
    .from("trainee_import_items")
    .select("id, status, program_id")
    .eq("source_id", candidate.sourceId)
    .eq("external_id", candidate.externalId)
    .maybeSingle()
  if (currentItemError) throw currentItemError

  if (currentItem) {
    const shouldLinkMatch = match && (currentItem.status !== "published" || currentItem.program_id !== match.program.id)
    const { error: seenError } = await adminClient
      .from("trainee_import_items")
      .update({
        ...candidateFields,
        ...(shouldLinkMatch ? {
          status: "published",
          program_id: match.program.id,
          reviewed_at: now,
          review_note: matchReviewNote(match),
        } : {}),
      })
      .eq("id", currentItem.id)
    if (seenError) throw seenError
    if (match) return { added: false, published: false }

    if (autoPublish && (currentItem.status === "pending" || !currentItem.program_id)) {
      await publishCandidateRow(adminClient, candidate, currentItem.id, existingPrograms)
      return { added: false, published: true }
    }
    return { added: false, published: false }
  }

  const { data: inserted, error: insertError } = await adminClient
    .from("trainee_import_items")
    .insert({
      source_id: candidate.sourceId,
      external_id: candidate.externalId,
      ...candidateFields,
      status: match ? "published" : "pending",
      program_id: match?.program.id || null,
      reviewed_at: match ? now : null,
      review_note: match ? matchReviewNote(match) : null,
      first_seen_at: now,
    })
    .select("id")
    .single()

  if (insertError?.code === "23505") {
    return recordCandidate(adminClient, candidate, runId, autoPublish, existingPrograms)
  }
  if (insertError) throw insertError
  if (match) return { added: false, published: false }
  if (!autoPublish) return { added: true, published: false }

  await publishCandidateRow(adminClient, candidate, inserted.id, existingPrograms)
  return { added: true, published: true }
}

async function processSource(
  adminClient: SupabaseClient,
  sourceId: string,
  autoPublish: boolean,
  existingPrograms: ExistingTraineeIdentity[]
): Promise<TraineeImportRunResult> {
  const source = getTraineeImportSources([sourceId])[0]
  if (!source) {
    return {
      sourceId,
      sourceName: sourceId,
      status: "failed",
      found: 0,
      added: 0,
      duplicates: 0,
      published: 0,
      errors: 1,
      message: "Source definition is not installed or is not approved for automated scanning.",
    }
  }

  const startedAt = new Date().toISOString()
  const { data: run, error: runError } = await adminClient
    .from("trainee_import_runs")
    .insert({ source_id: source.id, status: "running", started_at: startedAt })
    .select("id")
    .single()
  if (runError) throw runError

  let found = 0
  let added = 0
  let duplicates = 0
  let published = 0
  let errors = 0

  try {
    const scraped = await scrapeTraineeProgramSource(source)
    found = scraped.candidates.length
    errors += scraped.errors.length

    for (const candidate of scraped.candidates) {
      try {
        const result = await recordCandidate(adminClient, candidate, run.id, autoPublish, existingPrograms)
        if (result.added) added += 1
        else duplicates += 1
        if (result.published) published += 1
      } catch {
        errors += 1
      }
    }

    const status = errors > 0 ? "partial" : "succeeded"
    const completedAt = new Date().toISOString()
    await adminClient.from("trainee_import_runs").update({
      status,
      completed_at: completedAt,
      found_count: found,
      new_count: added,
      duplicate_count: duplicates,
      published_count: published,
      error_count: errors,
      error_message: scraped.errors.slice(0, 3).join(" | ") || null,
    }).eq("id", run.id)
    await adminClient.from("trainee_import_sources").update({
      last_checked_at: completedAt,
      last_success_at: completedAt,
      consecutive_failures: 0,
      last_error: scraped.errors.slice(0, 3).join(" | ") || null,
    }).eq("id", source.id)

    return { sourceId: source.id, sourceName: source.name, status, found, added, duplicates, published, errors }
  } catch (error) {
    const message = errorMessage(error)
    const completedAt = new Date().toISOString()
    await adminClient.from("trainee_import_runs").update({
      status: "failed",
      completed_at: completedAt,
      found_count: found,
      new_count: added,
      duplicate_count: duplicates,
      published_count: published,
      error_count: errors + 1,
      error_message: message.slice(0, 1_000),
    }).eq("id", run.id)

    const { data: sourceState } = await adminClient
      .from("trainee_import_sources")
      .select("consecutive_failures")
      .eq("id", source.id)
      .maybeSingle()
    await adminClient.from("trainee_import_sources").update({
      last_checked_at: completedAt,
      consecutive_failures: Number(sourceState?.consecutive_failures || 0) + 1,
      last_error: message.slice(0, 1_000),
    }).eq("id", source.id)

    return {
      sourceId: source.id,
      sourceName: source.name,
      status: "failed",
      found,
      added,
      duplicates,
      published,
      errors: errors + 1,
      message,
    }
  }
}

export async function runTraineeProgramImports(adminClient: SupabaseClient, options: ImportOptions = {}) {
  const definitions = getTraineeImportSources(options.sourceIds)
  if (!definitions.length) return []

  const { data, error } = await adminClient
    .from("trainee_import_sources")
    .select("id, enabled, auto_publish")
    .in("id", definitions.map((source) => source.id))
  if (error) throw new Error(`Trainee importer database is not ready: ${error.message}`)

  const settings = new Map(((data || []) as TraineeSourceDatabaseRow[]).map((source) => [source.id, source]))
  const selected = definitions.filter((source) => {
    const setting = settings.get(source.id)
    return setting && (setting.enabled || options.includeDisabled)
  })
  if (!selected.length) return []

  const existingPrograms = await loadExistingPrograms(adminClient)
  const results: TraineeImportRunResult[] = new Array(selected.length)
  let nextIndex = 0
  async function worker() {
    while (nextIndex < selected.length) {
      const index = nextIndex++
      const source = selected[index]
      const setting = settings.get(source.id)
      results[index] = await processSource(adminClient, source.id, Boolean(setting?.auto_publish), existingPrograms)
    }
  }
  await Promise.all(Array.from({ length: Math.min(SOURCE_CONCURRENCY, selected.length) }, () => worker()))
  return results
}

function importRowToCandidate(data: {
  external_id: string
  external_url: string
  title: string
  company: string
  location: string
  field: string
  description: string
  duration: string
  compensation: TraineeImportCandidate["compensation"]
  deadline: string
  published_at: string | null
  source_id: string
  source_metadata: Record<string, unknown> | null
  source: { name: string } | Array<{ name: string }> | null
}): TraineeImportCandidate {
  const source = Array.isArray(data.source) ? data.source[0] : data.source
  return {
    externalId: data.external_id,
    externalUrl: data.external_url,
    title: data.title,
    company: data.company,
    location: data.location,
    field: data.field,
    description: data.description,
    duration: data.duration,
    compensation: data.compensation,
    deadline: data.deadline,
    publishedAt: data.published_at,
    sourceId: data.source_id,
    sourceName: source?.name || data.source_id,
    sourceMetadata: data.source_metadata || {},
  }
}

export async function publishTraineeProgramCandidate(adminClient: SupabaseClient, candidateId: string) {
  const { data, error } = await adminClient
    .from("trainee_import_items")
    .select(IMPORT_CANDIDATE_SELECT)
    .eq("id", candidateId)
    .single()
  if (error) throw error
  if (data.status === "published" && data.program_id) return data.program_id
  if (data.status === "ignored") throw new Error("Ignored candidates must be restored before publishing.")
  return publishCandidateRow(adminClient, importRowToCandidate(data), data.id)
}

export async function publishTraineeProgramCandidateBatch(adminClient: SupabaseClient, cursor?: string | null) {
  let query = adminClient
    .from("trainee_import_items")
    .select(IMPORT_CANDIDATE_SELECT)
    .eq("status", "pending")
    .order("id", { ascending: true })
    .limit(BULK_PUBLISH_BATCH_SIZE + 1)
  if (cursor) query = query.gt("id", cursor)

  const { data, error } = await query
  if (error) throw error
  const rows = (data || []).slice(0, BULK_PUBLISH_BATCH_SIZE)
  if (!rows.length) {
    return { attempted: 0, published: 0, failed: [] as Array<{ id: string; title: string }>, nextCursor: null, hasMore: false }
  }

  const existingPrograms = await loadExistingPrograms(adminClient)
  const outcomes: Array<{ id: string; title: string; published: boolean }> = new Array(rows.length)
  let nextIndex = 0
  async function worker() {
    while (nextIndex < rows.length) {
      const index = nextIndex++
      const row = rows[index]
      try {
        await publishCandidateRow(adminClient, importRowToCandidate(row), row.id, existingPrograms)
        outcomes[index] = { id: row.id, title: row.title, published: true }
      } catch {
        outcomes[index] = { id: row.id, title: row.title, published: false }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(BULK_PUBLISH_CONCURRENCY, rows.length) }, () => worker()))
  return {
    attempted: outcomes.length,
    published: outcomes.filter((outcome) => outcome.published).length,
    failed: outcomes.filter((outcome) => !outcome.published).map(({ id, title }) => ({ id, title })),
    nextCursor: rows.at(-1)?.id || null,
    hasMore: (data || []).length > BULK_PUBLISH_BATCH_SIZE,
  }
}

export async function setTraineeProgramCandidateStatus(
  adminClient: SupabaseClient,
  candidateId: string,
  status: "pending" | "ignored"
) {
  const { error } = await adminClient
    .from("trainee_import_items")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      review_note: status === "ignored" ? "Ignored by an administrator." : "Restored for review.",
    })
    .eq("id", candidateId)
    .neq("status", "published")
  if (error) throw error
}
