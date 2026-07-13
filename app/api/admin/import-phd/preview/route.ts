import { NextResponse, type NextRequest } from "next/server"
import { fetchExternalPhdCandidates } from "@/lib/external-phd-importer"
import { isAdminRequest } from "@/lib/admin-server"
import { internalErrorResponse } from "@/lib/server-error"

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const feeds = Array.isArray(body.feeds) ? body.feeds.map(String) : []

    if (feeds.length === 0) {
      return NextResponse.json({ error: "Add at least one feed URL" }, { status: 400 })
    }

    const candidates = await fetchExternalPhdCandidates(feeds)

    return NextResponse.json({
      candidates,
      count: candidates.length,
    })
  } catch (error) {
    return internalErrorResponse(
      "external PhD preview",
      error,
      "Unable to import from the selected source."
    )
  }
}
