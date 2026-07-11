import { NextResponse, type NextRequest } from "next/server"
import { adminSessionCookieOptions, createAdminClient, createLegacyAdminSessionToken } from "@/lib/admin-server"
import { hashAdminPassword, verifyAdminPassword } from "@/lib/admin-password"

const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_ATTEMPTS_PER_WINDOW = 8
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const key = forwardedFor || request.headers.get("x-real-ip") || "unknown"
  const now = Date.now()

  if (loginAttempts.size > 2_000) {
    for (const [attemptKey, attempt] of loginAttempts) {
      if (attempt.resetAt <= now) loginAttempts.delete(attemptKey)
    }
  }

  const current = loginAttempts.get(key)

  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  current.count += 1
  return current.count > MAX_ATTEMPTS_PER_WINDOW
}

export async function POST(request: NextRequest) {
  if (isRateLimited(request)) {
    return NextResponse.json({ error: "Too many login attempts. Try again shortly." }, { status: 429 })
  }

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
    .select("id, username, password")
    .eq("username", identifier)
    .maybeSingle()

  const passwordCheck = data ? verifyAdminPassword(password, data.password) : null

  if (error || !data || !passwordCheck?.valid) {
    return NextResponse.json({ error: "Invalid admin username or password." }, { status: 401 })
  }

  if (passwordCheck.needsUpgrade) {
    const { error: migrationError } = await adminClient
      .from("admin_users")
      .update({ password: hashAdminPassword(password) })
      .eq("id", data.id)

    if (migrationError) {
      console.error("Unable to migrate legacy admin password hash:", migrationError.message)
      return NextResponse.json({ error: "Admin account security upgrade failed." }, { status: 500 })
    }
  }

  const token = createLegacyAdminSessionToken()

  if (!token) {
    return NextResponse.json({ error: "Admin session could not be created." }, { status: 500 })
  }

  loginAttempts.delete(
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"
  )

  const response = NextResponse.json({ ok: true })
  response.headers.set("Cache-Control", "no-store")
  response.cookies.set("gc_admin_token", token, adminSessionCookieOptions)

  return response
}
