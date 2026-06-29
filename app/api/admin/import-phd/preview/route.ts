import { NextResponse } from "next/server"
import { fetchExternalPhdCandidates } from "@/lib/external-phd-importer"

export async function POST(request: Request) {
  try {
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
    console.error("External PhD preview import failed:", error)
    return NextResponse.json({ error: "Unable to import from the selected source" }, { status: 500 })
  }
}
