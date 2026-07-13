import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient, isAdminRequest } from "@/lib/admin-server"
import { internalErrorResponse } from "@/lib/server-error"
import { toNullableUuid } from "@/lib/uuid"

function normalizeStatus(value: unknown) {
  return value === "approved" || value === "pending" || value === "rejected" ? value : "approved"
}

function normalizeCompensation(value: unknown) {
  return value === "unpaid" || value === "stipend" ? value : "paid"
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: "Admin API is not configured." }, { status: 500 })
  }

  const { data, error } = await adminClient
    .from("trainee_programs")
    .select("*, profiles:posted_by_user_id (name, type, is_verified, verification_badge)")
    .order("created_at", { ascending: false })

  if (error) {
    return internalErrorResponse("admin trainee program list", error, "Unable to load trainee programs.")
  }

  return NextResponse.json({ programs: data || [] })
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: "Admin API is not configured." }, { status: 500 })
  }

  const body = await request.json().catch(() => null)

  if (!body?.title || !body?.description || !body?.field || !body?.deadline) {
    return NextResponse.json({ error: "Missing required trainee program fields." }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from("trainee_programs")
    .insert({
      title: text(body.title),
      company: text(body.company, "Admin"),
      description: String(body.description),
      field: text(body.field),
      location: text(body.location, "Not specified"),
      duration: text(body.duration, "Not specified"),
      compensation: normalizeCompensation(body.compensation),
      deadline: text(body.deadline),
      posted_by: "admin",
      posted_by_user_id: toNullableUuid(body.posted_by_user_id ?? body.postedByUserId),
      external_url: text(body.external_url ?? body.externalUrl) || null,
      status: normalizeStatus(body.status),
      is_featured: Boolean(body.is_featured ?? body.isFeatured ?? false),
    })
    .select("*")
    .single()

  if (error) {
    return internalErrorResponse("admin trainee program create", error, "Unable to create this trainee program.")
  }

  return NextResponse.json({ program: data })
}
