import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient, isAdminRequest } from "@/lib/admin-server"
import { toNullableUuid } from "@/lib/uuid"

function normalizeStatus(value: unknown) {
  return value === "approved" || value === "pending" || value === "rejected" ? value : "approved"
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
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ posts: data || [] })
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

  if (!body?.title || !body?.slug || !body?.excerpt || !body?.content || !body?.author || !body?.category) {
    return NextResponse.json({ error: "Missing required blog fields." }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from("blog_posts")
    .insert({
      title: String(body.title).trim(),
      slug: String(body.slug).trim(),
      excerpt: String(body.excerpt).trim(),
      content: String(body.content),
      author: String(body.author).trim(),
      category: String(body.category).trim(),
      cover_image: body.cover_image || null,
      read_time: body.read_time || null,
      posted_by_user_id: toNullableUuid(body.posted_by_user_id),
      status: normalizeStatus(body.status),
    })
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ post: data })
}
