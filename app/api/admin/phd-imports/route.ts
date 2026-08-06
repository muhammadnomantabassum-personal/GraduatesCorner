import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient, isAdminRequest } from "@/lib/admin-server"
import {
  publishUniversityPhdCandidate,
  publishUniversityPhdCandidateBatch,
  runUniversityPhdImports,
  setUniversityPhdCandidateStatus,
} from "@/lib/phd-import/service"
import { getPhdImportSource, PHD_IMPORT_SOURCES } from "@/lib/phd-import/sources"
import { internalErrorResponse } from "@/lib/server-error"
import { toNullableUuid } from "@/lib/uuid"

export const maxDuration = 300

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: "Admin API is not configured." }, { status: 500 })
  }

  const [
    sourcesResult,
    pendingCandidatesResult,
    ignoredCandidatesResult,
    runsResult,
    pendingCountResult,
    ignoredCountResult,
  ] = await Promise.all([
    adminClient
      .from("phd_import_sources")
      .select("*")
      .order("name"),
    adminClient
      .from("phd_import_items")
      .select("*, source:phd_import_sources(name, organization)")
      .eq("status", "pending")
      .order("first_seen_at", { ascending: false })
      .limit(100),
    adminClient
      .from("phd_import_items")
      .select("*, source:phd_import_sources(name, organization)")
      .eq("status", "ignored")
      .order("first_seen_at", { ascending: false })
      .limit(100),
    adminClient
      .from("phd_import_runs")
      .select("*, source:phd_import_sources(name)")
      .order("started_at", { ascending: false })
      .limit(40),
    adminClient
      .from("phd_import_items")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    adminClient
      .from("phd_import_items")
      .select("id", { count: "exact", head: true })
      .eq("status", "ignored"),
  ])

  const error = sourcesResult.error
    || pendingCandidatesResult.error
    || ignoredCandidatesResult.error
    || runsResult.error
    || pendingCountResult.error
    || ignoredCountResult.error
  if (error) {
    return internalErrorResponse(
      "admin university PhD imports",
      error,
      "Unable to load the university importer."
    )
  }

  const candidates = [
    ...(pendingCandidatesResult.data || []),
    ...(ignoredCandidatesResult.data || []),
  ]
  const runs = runsResult.data || []

  return NextResponse.json({
    sources: sourcesResult.data || [],
    candidates,
    runs,
    summary: {
      enabledSources: (sourcesResult.data || []).filter((source) => source.enabled).length,
      pendingCandidates: pendingCountResult.count || 0,
      ignoredCandidates: ignoredCountResult.count || 0,
      recentFailures: runs.filter((run) => run.status === "failed").length,
    },
  })
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: "Admin API is not configured." }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const action = typeof body?.action === "string" ? body.action : ""

  try {
    if (action === "scan") {
      const sourceIds = Array.isArray(body.sourceIds)
        ? body.sourceIds
            .map(String)
            .filter((sourceId: string) => Boolean(getPhdImportSource(sourceId)))
            .slice(0, PHD_IMPORT_SOURCES.length)
        : undefined
      const results = await runUniversityPhdImports(adminClient, {
        sourceIds,
        includeDisabled: Boolean(sourceIds?.length),
      })
      return NextResponse.json({ results })
    }

    if (action === "publish-batch") {
      const cursor = body?.cursor == null ? null : toNullableUuid(body.cursor)
      if (body?.cursor != null && !cursor) {
        return NextResponse.json({ error: "A valid batch cursor is required." }, { status: 400 })
      }

      const result = await publishUniversityPhdCandidateBatch(adminClient, cursor)
      return NextResponse.json(result)
    }

    const candidateId = toNullableUuid(body?.candidateId)
    if (!candidateId) {
      return NextResponse.json({ error: "A valid candidate ID is required." }, { status: 400 })
    }

    if (action === "publish") {
      const thesisId = await publishUniversityPhdCandidate(adminClient, candidateId)
      return NextResponse.json({ thesisId })
    }

    if (action === "ignore" || action === "restore") {
      await setUniversityPhdCandidateStatus(
        adminClient,
        candidateId,
        action === "ignore" ? "ignored" : "pending"
      )
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Unsupported importer action." }, { status: 400 })
  } catch (error) {
    return internalErrorResponse(
      `admin university PhD import ${action || "action"}`,
      error,
      "The importer action could not be completed."
    )
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: "Admin API is not configured." }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const sourceId = typeof body?.sourceId === "string" ? body.sourceId : ""
  if (!getPhdImportSource(sourceId)) {
    return NextResponse.json({ error: "Unknown university source." }, { status: 400 })
  }

  const updates: Record<string, boolean | string> = {
    updated_at: new Date().toISOString(),
  }
  if (typeof body.enabled === "boolean") updates.enabled = body.enabled
  if (typeof body.autoPublish === "boolean") updates.auto_publish = body.autoPublish

  if (!("enabled" in updates) && !("auto_publish" in updates)) {
    return NextResponse.json({ error: "No source setting was supplied." }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from("phd_import_sources")
    .update(updates)
    .eq("id", sourceId)
    .select("*")
    .single()

  if (error) {
    return internalErrorResponse(
      "admin university source update",
      error,
      "Unable to update this university source."
    )
  }

  return NextResponse.json({ source: data })
}
