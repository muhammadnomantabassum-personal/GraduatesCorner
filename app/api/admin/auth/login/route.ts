import { NextResponse, type NextRequest } from "next/server"
import { adminSessionCookieOptions, createAdminClient, createLegacyAdminSessionToken } from "@/lib/admin-server"

export async function POST(request: NextRequest) {
  const adminClient = createAdminClient()

  if (!adminClient) {
    return NextResponse.json({ error: "Admin login is not configured." }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : ""
  const password = typeof body?.password === "string" ? body.password : ""

  if (!identifier || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from("admin_users")
    .select("username")
    .eq("username", identifier)
    .eq("password", password)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: "Invalid admin username or password." }, { status: 401 })
  }

  const token = createLegacyAdminSessionToken()

  if (!token) {
    return NextResponse.json({ error: "Admin session could not be created." }, { status: 500 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set("gc_admin_token", token, adminSessionCookieOptions)
  response.cookies.set("gc_admin_session", "true", adminSessionCookieOptions)

  return response
}
