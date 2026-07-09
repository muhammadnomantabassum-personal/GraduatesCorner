import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient, isAdminRequest } from "@/lib/admin-server"
import { toNullableUuid } from "@/lib/uuid"

function normalizeStatus(value: unknown) {
  return value === "approved" || value === "pending" || value === "rejected" ? value : undefined
}

function normalizeCompensation(value: unknown) {
  return value === "paid" || value === "unpaid" || value === "stipend" ? value : undefined
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: "Admin API is not configured." }, { status: 500 })
  }

  const { data, error } = await adminClient
    .from("trainee_programs")
    .select("*, profiles:posted_by_user_id (name, type, is_verified, verification_badge)")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Trainee program not found." }, { status: 404 })
  }

  return NextResponse.json({ program: data })
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
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Missing trainee program update fields." }, { status: 400 })
  }

  const updatePayload: Record<string, string | boolean | null> = {}
  const status = normalizeStatus(body.status)
  const compensation = normalizeCompensation(body.compensation)

  if (typeof body.title === "string") updatePayload.title = body.title.trim()
  if (typeof body.company === "string") updatePayload.company = body.company.trim()
  if (typeof body.description === "string") updatePayload.description = body.description
  if (typeof body.field === "string") updatePayload.field = body.field.trim()
  if (typeof body.location === "string") updatePayload.location = body.location.trim()
  if (typeof body.duration === "string") updatePayload.duration = body.duration.trim()
  if (compensation) updatePayload.compensation = compensation
  if (typeof body.deadline === "string") updatePayload.deadline = body.deadline
  if ("external_url" in body || "externalUrl" in body) updatePayload.external_url = stringOrNull(body.external_url ?? body.externalUrl)
  if (status) updatePayload.status = status
  if ("is_featured" in body || "isFeatured" in body) updatePayload.is_featured = Boolean(body.is_featured ?? body.isFeatured)
  if ("posted_by_user_id" in body || "postedByUserId" in body) {
    updatePayload.posted_by_user_id = toNullableUuid(body.posted_by_user_id ?? body.postedByUserId)
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "Missing trainee program update fields." }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from("trainee_programs")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ program: data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: "Admin API is not configured." }, { status: 500 })
  }

  const { error } = await adminClient
    .from("trainee_programs")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
