import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient, isAdminRequest } from "@/lib/admin-server"
import { internalErrorResponse } from "@/lib/server-error"

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: "Admin API is not configured." }, { status: 500 })
  }

  const { data, error } = await adminClient
    .from("testimonials")
    .select("*, profiles(avatar)")
    .order("created_at", { ascending: false })

  if (error) {
    return internalErrorResponse("admin testimonials list", error, "Unable to load testimonials.")
  }

  return NextResponse.json({ testimonials: data || [] })
}
