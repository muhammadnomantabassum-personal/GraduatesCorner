import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient, isAdminRequest } from "@/lib/admin-server"

function normalizeStatus(value: unknown) {
  return value === "approved" || value === "pending" || value === "rejected" ? value : undefined
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
  const status = normalizeStatus(body?.status)

  if (!status) {
    return NextResponse.json({ error: "Missing valid testimonial status." }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from("testimonials")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ testimonial: data })
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
    .from("testimonials")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
