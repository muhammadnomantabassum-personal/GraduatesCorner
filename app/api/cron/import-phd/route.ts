import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { fetchExternalPhdCandidates } from "@/lib/external-phd-importer"

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const requestSecret = request.headers.get("authorization")?.replace("Bearer ", "")

  if (cronSecret && requestSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const feedList = process.env.EXTERNAL_PHD_FEEDS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!feedList || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({
      imported: 0,
      skipped: 0,
      message: "Automatic import needs EXTERNAL_PHD_FEEDS and SUPABASE_SERVICE_ROLE_KEY.",
    })
  }

  const feeds = feedList.split(",").map((feed) => feed.trim()).filter(Boolean)
  const candidates = await fetchExternalPhdCandidates(feeds)
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  let imported = 0
  let skipped = 0

  for (const candidate of candidates) {
    const { data: existing } = await supabase
      .from("theses")
      .select("id")
      .eq("external_url", candidate.externalUrl)
      .maybeSingle()

    if (existing) {
      skipped += 1
      continue
    }

    const { error } = await supabase.from("theses").insert({
      title: candidate.title,
      type: "phd",
      subject: candidate.subject,
      description: candidate.description,
      location: candidate.location,
      deadline: candidate.deadline,
      compensation: candidate.compensation,
      external_url: candidate.externalUrl,
      organization: candidate.organization,
      organization_type: candidate.organizationType,
      posted_by: "admin",
      status: process.env.EXTERNAL_PHD_AUTO_PUBLISH === "true" ? "approved" : "pending",
    })

    if (error) {
      skipped += 1
    } else {
      imported += 1
    }
  }

  return NextResponse.json({ imported, skipped, checked: candidates.length })
}
