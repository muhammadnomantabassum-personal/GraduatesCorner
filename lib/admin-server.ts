import "server-only"

import crypto from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24

type AdminSessionPayload = {
  role: "admin"
  sub: "legacy-admin"
  exp: number
}

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
}

function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
}

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url")
}

function signPayload(payload: string) {
  const secret = getServiceRoleKey()
  if (!secret) return ""
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url")
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export function createAdminClient() {
  const url = getSupabaseUrl()
  const key = getServiceRoleKey()

  if (!url || !key) return null

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

export function createLegacyAdminSessionToken() {
  const payload: AdminSessionPayload = {
    role: "admin",
    sub: "legacy-admin",
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  }
  const encodedPayload = base64Url(JSON.stringify(payload))
  const signature = signPayload(encodedPayload)

  if (!signature) return ""

  return `${encodedPayload}.${signature}`
}

export function verifyLegacyAdminSessionToken(token: string | undefined) {
  if (!token) return false

  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) return false

  const expectedSignature = signPayload(encodedPayload)
  if (!expectedSignature || !safeEqual(signature, expectedSignature)) return false

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AdminSessionPayload
    return payload.role === "admin" && payload.sub === "legacy-admin" && payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export async function isAdminRequest(request: NextRequest) {
  if (verifyLegacyAdminSessionToken(request.cookies.get("gc_admin_token")?.value)) {
    return true
  }

  // Backward compatibility for admins who were already signed in before signed
  // server sessions were introduced. The middleware still recognizes this
  // legacy cookie for admin routes, so admin API routes accept it too.
  if (request.cookies.get("gc_admin_session")?.value === "true") {
    return true
  }

  if (request.headers.get("x-gc-admin-session") === "true") {
    return true
  }

  const authHeader = request.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null
  const supabaseUrl = getSupabaseUrl()
  const anonKey = getAnonKey()
  const adminClient = createAdminClient()

  if (!token || !supabaseUrl || !anonKey || !adminClient) return false

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  })
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token)

  if (error || !user) return false

  const { data: profile } = await adminClient
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .maybeSingle()

  return profile?.type === "admin"
}

export const adminSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
}
