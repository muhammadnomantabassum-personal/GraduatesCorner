import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/admin-server"
import { scanEmployer, syncEmployerSources } from "@/lib/employer-import/service"
import { getEmployerSource } from "@/lib/employer-import/catalogue"
import { reportServerError } from "@/lib/server-error"

export const maxDuration = 300
export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" }
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers })
  }
  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "Importer is not configured" }, { status: 503, headers })
  try {
    await syncEmployerSources(db)
    // Prioritize the oldest scan, then process as many enabled sources as the runtime allows.
    const started = Date.now()
    const { data, error } = await db.from("employer_import_sources").select("id")
      .eq("enabled", true).order("last_checked_at", { ascending: true, nullsFirst: true }).order("id").limit(200)
    if (error) throw error
    const selected = (data || []).filter(row => getEmployerSource(row.id) && !getEmployerSource(row.id)!.note)
    const results: { source: string; status: string }[] = []
    let index = 0
    await Promise.all(Array.from({ length: Math.min(3, selected.length) }, async () => {
      while (index < selected.length && Date.now() - started < 200_000) {
        const source = selected[index++].id
        try { results.push({ source, ...(await scanEmployer(db, source)) }) }
        catch { results.push({ source, status: "failed" }) }
      }
    }))
    return NextResponse.json({ results }, { headers })
  } catch (error) {
    reportServerError("scheduled employer import", error)
    return NextResponse.json({ error: "Scheduled employer import failed" }, { status: 500, headers })
  }
}
