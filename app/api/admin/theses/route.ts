import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient, isAdminRequest } from "@/lib/admin-server"
import { internalErrorResponse } from "@/lib/server-error"
import { toNullableUuid } from "@/lib/uuid"

function normalizeStatus(value: unknown) {
  return value === "approved" || value === "pending" || value === "rejected" ? value : "approved"
}

function normalizeThesisType(value: unknown) {
  return value === "phd" ? "phd" : "master"
}

function normalizeOrganizationType(value: unknown) {
  return value === "company" ? "company" : "university"
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

  const type = request.nextUrl.searchParams.get("type")
  let query = adminClient
    .from("theses")
    .select("*, profiles:posted_by_user_id (name, type, is_verified, verification_badge)")

  if (type === "master" || type === "phd") {
    query = query.eq("type", type)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    return internalErrorResponse("admin opportunities list", error, "Unable to load opportunities.")
  }

  return NextResponse.json({ theses: data || [] })
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

  if (!body?.title || !body?.description || !body?.subject || !body?.deadline) {
    return NextResponse.json({ error: "Missing required opportunity fields." }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from("theses")
    .insert({
      title: text(body.title),
      type: normalizeThesisType(body.type),
      subject: text(body.subject),
      description: String(body.description),
      organization: text(body.organization, "Admin"),
      organization_type: normalizeOrganizationType(body.organization_type ?? body.organizationType),
      location: text(body.location, "Not specified"),
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
    return internalErrorResponse("admin opportunity create", error, "Unable to create this opportunity.")
  }

  return NextResponse.json({ thesis: data })
}
