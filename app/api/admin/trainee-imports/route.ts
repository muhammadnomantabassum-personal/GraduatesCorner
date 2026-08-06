import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient, isAdminRequest } from "@/lib/admin-server"
import { internalErrorResponse } from "@/lib/server-error"
import {
  publishTraineeProgramCandidate,
  publishTraineeProgramCandidateBatch,
  runTraineeProgramImports,
  setTraineeProgramCandidateStatus,
} from "@/lib/trainee-import/service"
import { getTraineeImportSource, TRAINEE_IMPORT_SOURCES } from "@/lib/trainee-import/sources"
import { toNullableUuid } from "@/lib/uuid"

export const maxDuration = 300

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const adminClient = createAdminClient()
  if (!adminClient) return NextResponse.json({ error: "Admin API is not configured." }, { status: 500 })

  const [sources, pending, ignored, runs, pendingCount, ignoredCount] = await Promise.all([
    adminClient.from("trainee_import_sources").select("*").order("name"),
    adminClient.from("trainee_import_items").select("*, source:trainee_import_sources(name, organization)").eq("status", "pending").order("first_seen_at", { ascending: false }).limit(100),
    adminClient.from("trainee_import_items").select("*, source:trainee_import_sources(name, organization)").eq("status", "ignored").order("first_seen_at", { ascending: false }).limit(100),
    adminClient.from("trainee_import_runs").select("*, source:trainee_import_sources(name)").order("started_at", { ascending: false }).limit(40),
    adminClient.from("trainee_import_items").select("id", { count: "exact", head: true }).eq("status", "pending"),
    adminClient.from("trainee_import_items").select("id", { count: "exact", head: true }).eq("status", "ignored"),
  ])

  const error = sources.error || pending.error || ignored.error || runs.error || pendingCount.error || ignoredCount.error
  if (error) return internalErrorResponse("admin trainee imports", error, "Unable to load the trainee importer.")

  const enrichedSources = (sources.data || []).map((source) => {
    const definition = getTraineeImportSource(source.id)
    return {
      ...source,
      scannable: Boolean(definition?.scannable),
      access_note: definition?.accessNote || null,
    }
  })
  const recentRuns = runs.data || []
  return NextResponse.json({
    sources: enrichedSources,
    candidates: [...(pending.data || []), ...(ignored.data || [])],
    runs: recentRuns,
    summary: {
      enabledSources: enrichedSources.filter((source) => source.enabled && source.scannable).length,
      pendingCandidates: pendingCount.count || 0,
      ignoredCandidates: ignoredCount.count || 0,
      recentFailures: recentRuns.filter((run) => run.status === "failed").length,
    },
  })
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const adminClient = createAdminClient()
  if (!adminClient) return NextResponse.json({ error: "Admin API is not configured." }, { status: 500 })

  const body = await request.json().catch(() => null)
  const action = typeof body?.action === "string" ? body.action : ""
  try {
    if (action === "scan") {
      const requested = Array.isArray(body.sourceIds) ? body.sourceIds.map(String).slice(0, TRAINEE_IMPORT_SOURCES.length) : undefined
      const sourceIds = requested?.filter((sourceId: string) => getTraineeImportSource(sourceId)?.scannable)
      if (requested?.length && !sourceIds?.length) {
        return NextResponse.json({ error: "This source requires permission or a licensed feed before it can be scanned." }, { status: 409 })
      }
      const results = await runTraineeProgramImports(adminClient, {
        sourceIds,
        includeDisabled: Boolean(sourceIds?.length),
      })
      return NextResponse.json({ results })
    }

    if (action === "publish-batch") {
      const cursor = body?.cursor == null ? null : toNullableUuid(body.cursor)
      if (body?.cursor != null && !cursor) return NextResponse.json({ error: "A valid batch cursor is required." }, { status: 400 })
      return NextResponse.json(await publishTraineeProgramCandidateBatch(adminClient, cursor))
    }

    const candidateId = toNullableUuid(body?.candidateId)
    if (!candidateId) return NextResponse.json({ error: "A valid candidate ID is required." }, { status: 400 })
    if (action === "publish") {
      return NextResponse.json({ programId: await publishTraineeProgramCandidate(adminClient, candidateId) })
    }
    if (action === "ignore" || action === "restore") {
      await setTraineeProgramCandidateStatus(adminClient, candidateId, action === "ignore" ? "ignored" : "pending")
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: "Unsupported importer action." }, { status: 400 })
  } catch (error) {
    return internalErrorResponse(`admin trainee import ${action || "action"}`, error, "The importer action could not be completed.")
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const adminClient = createAdminClient()
  if (!adminClient) return NextResponse.json({ error: "Admin API is not configured." }, { status: 500 })

  const body = await request.json().catch(() => null)
  const sourceId = typeof body?.sourceId === "string" ? body.sourceId : ""
  const definition = getTraineeImportSource(sourceId)
  if (!definition) return NextResponse.json({ error: "Unknown trainee source." }, { status: 400 })
  if (!definition.scannable) return NextResponse.json({ error: definition.accessNote || "This source cannot be enabled." }, { status: 409 })

  const updates: Record<string, boolean | string> = { updated_at: new Date().toISOString() }
  if (typeof body.enabled === "boolean") updates.enabled = body.enabled
  if (typeof body.autoPublish === "boolean") updates.auto_publish = body.autoPublish
  if (!("enabled" in updates) && !("auto_publish" in updates)) {
    return NextResponse.json({ error: "No source setting was supplied." }, { status: 400 })
  }

  const { data, error } = await adminClient.from("trainee_import_sources").update(updates).eq("id", sourceId).select("*").single()
  if (error) return internalErrorResponse("admin trainee source update", error, "Unable to update this trainee source.")
  return NextResponse.json({ source: { ...data, scannable: true, access_note: null } })
}
