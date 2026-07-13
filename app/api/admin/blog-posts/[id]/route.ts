import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient, isAdminRequest } from "@/lib/admin-server"
import { internalErrorResponse } from "@/lib/server-error"

function normalizeStatus(value: unknown) {
  return value === "approved" || value === "pending" || value === "rejected" ? value : "approved"
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
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: "Blog post not found." }, { status: 404 })
  }

  return NextResponse.json({ post: data })
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
    return NextResponse.json({ error: "Missing blog update fields." }, { status: 400 })
  }

  const updatePayload: Record<string, string | null> = {}

  if (typeof body.title === "string") updatePayload.title = body.title.trim()
  if (typeof body.slug === "string") updatePayload.slug = body.slug.trim()
  if (typeof body.excerpt === "string") updatePayload.excerpt = body.excerpt.trim()
  if (typeof body.content === "string") updatePayload.content = body.content
  if (typeof body.author === "string") updatePayload.author = body.author.trim()
  if (typeof body.category === "string") updatePayload.category = body.category.trim()
  if ("cover_image" in body) updatePayload.cover_image = body.cover_image || null
  if ("read_time" in body) updatePayload.read_time = body.read_time || null
  if ("status" in body) updatePayload.status = normalizeStatus(body.status)

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "Missing blog update fields." }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from("blog_posts")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    return internalErrorResponse("admin blog update", error, "Unable to update this blog post.")
  }

  return NextResponse.json({ post: data })
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
    .from("blog_posts")
    .delete()
    .eq("id", id)

  if (error) {
    return internalErrorResponse("admin blog delete", error, "Unable to delete this blog post.")
  }

  return NextResponse.json({ ok: true })
}
