import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient, isAdminRequest } from "@/lib/admin-server"
import { EMPLOYER_SOURCES, getEmployerSource } from "@/lib/employer-import/catalogue"
import { processEmployerImportBatch, publishEmployerImport, refreshEmployerImport, scanEmployer, syncEmployerSources } from "@/lib/employer-import/service"
import { toNullableUuid } from "@/lib/uuid"

export const maxDuration = 120
const headers = { "Cache-Control": "private, no-store" }
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers })

export async function GET(request: NextRequest) {
  if (!await isAdminRequest(request)) return json({ error: "Unauthorized" }, 401)
  const db = createAdminClient()
  if (!db) return json({ error: "Importer is not configured" }, 503)
  const section = request.nextUrl.searchParams.get("section") === "trainee" ? "trainee" : "master"
  const rawPage = Number(request.nextUrl.searchParams.get("page") || 0)
  const page = Number.isInteger(rawPage) && rawPage >= 0 && rawPage <= 10000 ? rawPage : 0
  const state = request.nextUrl.searchParams.get("status") === "ignored" ? "ignored" : "pending"
  try {
    await syncEmployerSources(db)
    const [settings, queue, runs] = await Promise.all([
      db.from("employer_import_sources").select("id,enabled,auto_publish,cursor,last_checked_at,last_success_at,last_error,lock_until"),
      db.from("employer_import_items").select("*", { count: "exact" }).in("kind", section === "trainee" ? ["trainee"] : ["master_thesis", "internship"]).eq("status", state).order("first_seen_at", { ascending: false }).order("id").range(page * 30, page * 30 + 29),
      db.from("employer_import_runs").select("*").order("started_at", { ascending: false }).limit(30),
    ])
    if (settings.error || queue.error || runs.error) throw new Error("Database schema unavailable")
    return json({ sources: EMPLOYER_SOURCES.map(source => ({ ...source, ...settings.data?.find(row => row.id === source.id) })), candidates: queue.data, total: queue.count || 0, page, runs: runs.data })
  } catch { return json({ error: "Unable to load employer imports. Apply supabase_employer_imports_setup.sql before using this importer." }, 503) }
}

export async function POST(request: NextRequest) {
  if (!await isAdminRequest(request)) return json({ error: "Unauthorized" }, 401)
  if (request.headers.get("origin") !== request.nextUrl.origin) return json({ error: "Invalid request origin" }, 403)
  const db = createAdminClient()
  if (!db) return json({ error: "Importer is not configured" }, 503)
  const body = await request.json().catch(() => null)
  try {
    if (body?.action === "scan") {
      if (!getEmployerSource(body.sourceId)) return json({ error: "Unknown source" }, 400)
      return json(await scanEmployer(db, body.sourceId, body.section === "trainee" ? "trainee" : "master"))
    }
    if (body?.action === "settings") {
      const source = getEmployerSource(body.sourceId)
      if (!source || source.note) return json({ error: source?.note || "Unknown source" }, 400)
      const updates: Record<string, boolean> = {}
      if (typeof body.enabled === "boolean") updates.enabled = body.enabled
      if (typeof body.autoPublish === "boolean") updates.auto_publish = body.autoPublish
      if (!Object.keys(updates).length) return json({ error: "No setting supplied" }, 400)
      const { error } = await db.from("employer_import_sources").update(updates).eq("id", source.id)
      if (error) throw new Error("Unable to update source")
      return json({ ok: true })
    }
    if (body?.action === "refresh-batch" || body?.action === "publish-batch") {
      const cursor = body.cursor == null ? null : toNullableUuid(body.cursor)
      if (body.cursor != null && !cursor) return json({ error: "Invalid batch cursor" }, 400)
      return json(await processEmployerImportBatch(db, body.section === "trainee" ? "trainee" : "master", cursor, body.action === "publish-batch"))
    }
    const id = toNullableUuid(body?.candidateId)
    if (!id) return json({ error: "A valid candidate ID is required" }, 400)
    if (body.action === "ignore" || body.action === "restore") {
      const { error } = await db.from("employer_import_items").update({ status: body.action === "ignore" ? "ignored" : "pending", reviewed_at: new Date().toISOString() }).eq("id", id).eq("status", body.action === "ignore" ? "pending" : "ignored")
      if (error) throw new Error("Unable to update candidate")
      return json({ ok: true })
    }
    if (body.action === "publish") {
      return json({ targetId: await publishEmployerImport(db, id) })
    }
    if (body.action === "refresh") return json(await refreshEmployerImport(db, id))
    return json({ error: "Unknown importer action" }, 400)
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Employer import failed" }, 409) }
}
