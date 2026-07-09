import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient, isAdminRequest } from "@/lib/admin-server"

function normalizeBadge(value: unknown) {
  return value === "trusted" || value === "featured" ? value : "verified"
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: "Admin API is not configured." }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const shouldVerify = Boolean(body?.is_verified)
  const badge = normalizeBadge(body?.verification_badge)

  const { data, error } = await adminClient
    .from("profiles")
    .update({
      is_verified: shouldVerify,
      verified_at: shouldVerify ? new Date().toISOString() : null,
      verified_by: shouldVerify ? "admin" : null,
      verification_note: shouldVerify ? `Manually assigned ${badge} trust badge by GraduatesCorner admin` : null,
      verification_badge: shouldVerify ? badge : "verified",
    })
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ user: data })
}
