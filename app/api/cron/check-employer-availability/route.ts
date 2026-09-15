import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { createAdminClient } from "@/lib/admin-server"
import { recheckEmployerAvailability } from "@/lib/employer-import/service"
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
    const results = await recheckEmployerAvailability(db)
    revalidateTag("public-opportunities", { expire: 0 })
    return NextResponse.json(results, { headers })
  } catch (error) {
    reportServerError("scheduled vacancy availability", error)
    return NextResponse.json({ error: "Availability checks failed" }, { status: 500, headers })
  }
}
