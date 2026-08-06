import "server-only"

import { createHash } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  findExistingPhdMatch,
  type ExistingPhdIdentity,
  type PhdIdentityMatch,
} from "./dedupe"
import { scrapeUniversityPhdSource } from "./parser"
import { getPhdImportSources } from "./sources"
import type {
  PhdImportCandidate,
  PhdImportRunResult,
  PhdSourceDatabaseRow,
} from "./types"

type ImportOptions = {
  sourceIds?: string[]
  includeDisabled?: boolean
}

const SOURCE_CONCURRENCY = 3
const BULK_PUBLISH_CONCURRENCY = 4
const BULK_PUBLISH_BATCH_SIZE = 40
const EXISTING_PHD_PAGE_SIZE = 1_000

const IMPORT_CANDIDATE_SELECT = `
  id, external_id, external_url, title, organization, location, subject,
  description, deadline, published_at, compensation, source_id,
  source_metadata, status, thesis_id,
  source:phd_import_sources(name)
`

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown import error"
}

function fingerprint(candidate: PhdImportCandidate) {
  return createHash("sha256")
    .update(`${candidate.sourceId}:${candidate.externalId}:${candidate.externalUrl}`)
    .digest("hex")
}

function matchReviewNote(match: PhdIdentityMatch) {
  const reason = {
    external_url: "official URL",
    external_id: "university vacancy ID",
    title_organization_deadline: "title, university, and deadline",
  }[match.reason]

  return `Matched an existing PhD position by ${reason}; no duplicate was created.`
}

async function loadExistingPhds(adminClient: SupabaseClient) {
  const rows: ExistingPhdIdentity[] = []

  for (let from = 0; ; from += EXISTING_PHD_PAGE_SIZE) {
    const { data, error } = await adminClient
      .from("theses")
      .select("id, title, organization, deadline, external_url, external_id, status")
      .eq("type", "phd")
      .order("id", { ascending: true })
      .range(from, from + EXISTING_PHD_PAGE_SIZE - 1)

    if (error) throw error

    const page = (data || []) as ExistingPhdIdentity[]
    rows.push(...page)
    if (page.length < EXISTING_PHD_PAGE_SIZE) break
  }

  return rows
}

function thesisRow(candidate: PhdImportCandidate, status: "approved" | "pending") {
  return {
    title: candidate.title,
    type: "phd",
    subject: candidate.subject,
    description: candidate.description,
    location: candidate.location,
    deadline: candidate.deadline,
    compensation: candidate.compensation,
    external_url: candidate.externalUrl,
    external_id: candidate.externalId,
    source_name: candidate.sourceName,
    source_published_at: candidate.publishedAt,
    last_synced_at: new Date().toISOString(),
    organization: candidate.organization,
    organization_type: "university",
    posted_by: "admin",
    posted_by_user_id: null,
    status,
  }
}

async function publishCandidateRow(
  adminClient: SupabaseClient,
  candidate: PhdImportCandidate,
  importItemId: string,
  existingPhds?: ExistingPhdIdentity[]
) {
  const knownPhds = existingPhds || await loadExistingPhds(adminClient)
  let match = findExistingPhdMatch(candidate, knownPhds)
  let thesisId = match?.thesis.id

  if (!thesisId) {
    const { data: created, error: createError } = await adminClient
      .from("theses")
      .insert(thesisRow(candidate, "approved"))
      .select("id")
      .single()

    if (createError?.code === "23505") {
      const refreshedPhds = await loadExistingPhds(adminClient)
      match = findExistingPhdMatch(candidate, refreshedPhds)
      thesisId = match?.thesis.id
    } else if (createError) {
      throw createError
    } else {
      const createdThesisId = created.id as string
      thesisId = createdThesisId
      knownPhds.push({
        id: createdThesisId,
        title: candidate.title,
        organization: candidate.organization,
        deadline: candidate.deadline,
        external_url: candidate.externalUrl,
        external_id: candidate.externalId,
        status: "approved",
      })
    }
  }

  if (!thesisId) throw new Error("Could not publish or match the imported PhD position.")

  const { error: updateError } = await adminClient
    .from("phd_import_items")
    .update({
      status: "published",
      thesis_id: thesisId,
      reviewed_at: new Date().toISOString(),
      review_note: match
        ? matchReviewNote(match)
        : "Published by the automated university importer.",
    })
    .eq("id", importItemId)

  if (updateError) throw updateError
  return thesisId
}

async function recordCandidate(
  adminClient: SupabaseClient,
  candidate: PhdImportCandidate,
  runId: string,
  autoPublish: boolean,
  existingPhds: ExistingPhdIdentity[]
) {
  const now = new Date().toISOString()
  const candidateFields = {
    run_id: runId,
    external_url: candidate.externalUrl,
    fingerprint: fingerprint(candidate),
    title: candidate.title,
    organization: candidate.organization,
    location: candidate.location,
    subject: candidate.subject,
    description: candidate.description,
    deadline: candidate.deadline,
    published_at: candidate.publishedAt,
    compensation: candidate.compensation,
    source_metadata: candidate.sourceMetadata,
    last_seen_at: now,
  }
  const match = findExistingPhdMatch(candidate, existingPhds)

  const { data: currentItem, error: currentItemError } = await adminClient
    .from("phd_import_items")
    .select("id, status, thesis_id")
    .eq("source_id", candidate.sourceId)
    .eq("external_id", candidate.externalId)
    .maybeSingle()

  if (currentItemError) throw currentItemError

  if (currentItem) {
    const shouldLinkMatch =
      match &&
      (currentItem.status !== "published" || currentItem.thesis_id !== match.thesis.id)
    const { error: seenError } = await adminClient
      .from("phd_import_items")
      .update({
        ...candidateFields,
        ...(shouldLinkMatch
          ? {
              status: "published",
              thesis_id: match.thesis.id,
              reviewed_at: now,
              review_note: matchReviewNote(match),
            }
          : {}),
      })
      .eq("id", currentItem.id)

    if (seenError) throw seenError
    if (match) return { added: false, published: false }

    if (
      autoPublish &&
      (currentItem.status === "pending" || !currentItem.thesis_id)
    ) {
      await publishCandidateRow(adminClient, candidate, currentItem.id, existingPhds)
      return { added: false, published: true }
    }

    return { added: false, published: false }
  }

  const row = {
    source_id: candidate.sourceId,
    external_id: candidate.externalId,
    ...candidateFields,
    status: match ? "published" : "pending",
    thesis_id: match?.thesis.id || null,
    reviewed_at: match ? now : null,
    review_note: match ? matchReviewNote(match) : null,
    first_seen_at: now,
  }

  const { data: inserted, error: insertError } = await adminClient
    .from("phd_import_items")
    .insert(row)
    .select("id")
    .single()

  if (insertError?.code === "23505") {
    return recordCandidate(adminClient, candidate, runId, autoPublish, existingPhds)
  }

  if (insertError) throw insertError
  if (match) return { added: false, published: false }
  if (!autoPublish) return { added: true, published: false }

  await publishCandidateRow(adminClient, candidate, inserted.id, existingPhds)
  return { added: true, published: true }
}

async function processSource(
  adminClient: SupabaseClient,
  sourceId: string,
  autoPublish: boolean,
  existingPhds: ExistingPhdIdentity[]
): Promise<PhdImportRunResult> {
  const source = getPhdImportSources([sourceId])[0]
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
      message: "Source definition is not installed.",
    }
  }

  const startedAt = new Date().toISOString()
  const { data: run, error: runError } = await adminClient
    .from("phd_import_runs")
    .insert({
      source_id: source.id,
      status: "running",
      started_at: startedAt,
    })
    .select("id")
    .single()

  if (runError) throw runError

  let found = 0
  let added = 0
  let duplicates = 0
  let published = 0
  let errors = 0

  try {
    const scraped = await scrapeUniversityPhdSource(source)
    found = scraped.candidates.length
    errors += scraped.errors.length

    for (const candidate of scraped.candidates) {
      try {
        const result = await recordCandidate(
          adminClient,
          candidate,
          run.id,
          autoPublish,
          existingPhds
        )
        if (result.added) added += 1
        else duplicates += 1
        if (result.published) published += 1
      } catch {
        errors += 1
      }
    }

    const status = errors > 0 ? "partial" : "succeeded"
    const completedAt = new Date().toISOString()

    await adminClient
      .from("phd_import_runs")
      .update({
        status,
        completed_at: completedAt,
        found_count: found,
        new_count: added,
        duplicate_count: duplicates,
        published_count: published,
        error_count: errors,
        error_message: scraped.errors.slice(0, 3).join(" | ") || null,
      })
      .eq("id", run.id)

    await adminClient
      .from("phd_import_sources")
      .update({
        last_checked_at: completedAt,
        last_success_at: completedAt,
        consecutive_failures: 0,
        last_error: scraped.errors.slice(0, 3).join(" | ") || null,
      })
      .eq("id", source.id)

    return {
      sourceId: source.id,
      sourceName: source.name,
      status,
      found,
      added,
      duplicates,
      published,
      errors,
    }
  } catch (error) {
    const message = errorMessage(error)
    const completedAt = new Date().toISOString()

    await adminClient
      .from("phd_import_runs")
      .update({
        status: "failed",
        completed_at: completedAt,
        found_count: found,
        new_count: added,
        duplicate_count: duplicates,
        published_count: published,
        error_count: errors + 1,
        error_message: message.slice(0, 1_000),
      })
      .eq("id", run.id)

    const { data: sourceState } = await adminClient
      .from("phd_import_sources")
      .select("consecutive_failures")
      .eq("id", source.id)
      .maybeSingle()

    await adminClient
      .from("phd_import_sources")
      .update({
        last_checked_at: completedAt,
        consecutive_failures: Number(sourceState?.consecutive_failures || 0) + 1,
        last_error: message.slice(0, 1_000),
      })
      .eq("id", source.id)

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

export async function runUniversityPhdImports(
  adminClient: SupabaseClient,
  options: ImportOptions = {}
) {
  const definitions = getPhdImportSources(options.sourceIds)
  if (definitions.length === 0) return []

  const { data, error } = await adminClient
    .from("phd_import_sources")
    .select("id, enabled, auto_publish")
    .in("id", definitions.map((source) => source.id))

  if (error) {
    throw new Error(`University importer database is not ready: ${error.message}`)
  }

  const settings = new Map(
    ((data || []) as PhdSourceDatabaseRow[]).map((source) => [source.id, source])
  )
  const selected = definitions.filter((source) => {
    const setting = settings.get(source.id)
    return setting && (setting.enabled || options.includeDisabled)
  })
  if (selected.length === 0) return []

  const existingPhds = await loadExistingPhds(adminClient)
  const results: PhdImportRunResult[] = new Array(selected.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < selected.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      const source = selected[currentIndex]
      const setting = settings.get(source.id)
      results[currentIndex] = await processSource(
        adminClient,
        source.id,
        Boolean(setting?.auto_publish),
        existingPhds
      )
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(SOURCE_CONCURRENCY, selected.length) }, () => worker())
  )

  return results
}

export async function publishUniversityPhdCandidate(
  adminClient: SupabaseClient,
  candidateId: string
) {
  const { data, error } = await adminClient
    .from("phd_import_items")
    .select(IMPORT_CANDIDATE_SELECT)
    .eq("id", candidateId)
    .single()

  if (error) throw error
  if (data.status === "published" && data.thesis_id) return data.thesis_id
  if (data.status === "ignored") throw new Error("Ignored candidates must be restored before publishing.")

  return publishCandidateRow(adminClient, importRowToCandidate(data), data.id)
}

function importRowToCandidate(data: {
  external_id: string
  external_url: string
  title: string
  organization: string
  location: string
  subject: string
  description: string
  deadline: string
  published_at: string | null
  compensation: PhdImportCandidate["compensation"]
  source_id: string
  source_metadata: Record<string, unknown> | null
  source: { name: string } | Array<{ name: string }> | null
}): PhdImportCandidate {
  const sourceRelation = Array.isArray(data.source) ? data.source[0] : data.source

  return {
    externalId: data.external_id,
    externalUrl: data.external_url,
    title: data.title,
    organization: data.organization,
    location: data.location,
    subject: data.subject,
    description: data.description,
    deadline: data.deadline,
    publishedAt: data.published_at,
    compensation: data.compensation,
    sourceId: data.source_id,
    sourceName: sourceRelation?.name || data.source_id,
    sourceMetadata: data.source_metadata || {},
  }
}

export async function publishUniversityPhdCandidateBatch(
  adminClient: SupabaseClient,
  cursor?: string | null
) {
  let query = adminClient
    .from("phd_import_items")
    .select(IMPORT_CANDIDATE_SELECT)
    .eq("status", "pending")
    .order("id", { ascending: true })
    .limit(BULK_PUBLISH_BATCH_SIZE + 1)

  if (cursor) query = query.gt("id", cursor)

  const { data, error } = await query
  if (error) throw error

  const rows = (data || []).slice(0, BULK_PUBLISH_BATCH_SIZE)
  if (rows.length === 0) {
    return {
      attempted: 0,
      published: 0,
      failed: [] as Array<{ id: string; title: string }>,
      nextCursor: null,
      hasMore: false,
    }
  }

  const existingPhds = await loadExistingPhds(adminClient)
  const outcomes: Array<{ id: string; title: string; published: boolean }> = new Array(rows.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < rows.length) {
      const currentIndex = nextIndex++
      const row = rows[currentIndex]

      try {
        await publishCandidateRow(
          adminClient,
          importRowToCandidate(row),
          row.id,
          existingPhds
        )
        outcomes[currentIndex] = { id: row.id, title: row.title, published: true }
      } catch {
        outcomes[currentIndex] = { id: row.id, title: row.title, published: false }
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(BULK_PUBLISH_CONCURRENCY, rows.length) },
      () => worker()
    )
  )

  return {
    attempted: outcomes.length,
    published: outcomes.filter((outcome) => outcome.published).length,
    failed: outcomes
      .filter((outcome) => !outcome.published)
      .map(({ id, title }) => ({ id, title })),
    nextCursor: rows.at(-1)?.id || null,
    hasMore: (data || []).length > BULK_PUBLISH_BATCH_SIZE,
  }
}

export async function setUniversityPhdCandidateStatus(
  adminClient: SupabaseClient,
  candidateId: string,
  status: "pending" | "ignored"
) {
  const { error } = await adminClient
    .from("phd_import_items")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      review_note: status === "ignored" ? "Ignored by an administrator." : "Restored for review.",
    })
    .eq("id", candidateId)
    .neq("status", "published")

  if (error) throw error
}
