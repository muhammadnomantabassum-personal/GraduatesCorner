import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/admin-server"
import { runUniversityPhdImports } from "@/lib/phd-import/service"
import { reportServerError } from "@/lib/server-error"

export const maxDuration = 300

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: "University importer is not configured." }, { status: 503 })
  }

  try {
    const results = await runUniversityPhdImports(adminClient)
    const totals = results.reduce(
      (summary, result) => ({
        found: summary.found + result.found,
        added: summary.added + result.added,
        duplicates: summary.duplicates + result.duplicates,
        published: summary.published + result.published,
        errors: summary.errors + result.errors,
      }),
      { found: 0, added: 0, duplicates: 0, published: 0, errors: 0 }
    )

    return NextResponse.json({
      ok: results.every((result) => result.status !== "failed"),
      sources: results.length,
      totals,
      results,
    })
  } catch (error) {
    reportServerError("scheduled university PhD import", error)
    return NextResponse.json(
      { error: "Scheduled university import failed." },
      { status: 500 }
    )
  }
}
