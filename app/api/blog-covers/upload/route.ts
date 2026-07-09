import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const MAX_UPLOAD_SIZE = 2 * 1024 * 1024
const BUCKET = "blog-covers"

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    return NextResponse.json(
      { error: "Blog cover upload is not configured on the server." },
      { status: 500 }
    )
  }

  const isLegacyAdmin = request.cookies.get("gc_admin_session")?.value === "true"
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null
  let actorId = isLegacyAdmin ? "admin" : ""

  if (token && anonKey) {
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    })
    const {
      data: { user },
      error,
    } = await authClient.auth.getUser(token)

    if (!error && user) {
      actorId = user.id
    }
  }

  if (!actorId) {
    return NextResponse.json({ error: "You must be logged in to upload a cover image." }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image file was provided." }, { status: 400 })
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files can be uploaded." }, { status: 400 })
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: "Image is too large after optimization." }, { status: 400 })
  }

  const storageClient = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })
    : token && anonKey
      ? createClient(supabaseUrl, anonKey, {
          auth: { persistSession: false },
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        })
      : null

  if (!storageClient) {
    return NextResponse.json(
      { error: "Blog cover upload needs a signed-in Supabase session or a server service role key." },
      { status: 401 }
    )
  }
  const fileExt = file.type === "image/png" ? "png" : "webp"
  const filePath = `${actorId}/blog-cover-${crypto.randomUUID()}.${fileExt}`
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const { error } = await storageClient.storage.from(BUCKET).upload(filePath, fileBuffer, {
    cacheControl: "31536000",
    contentType: file.type || "image/webp",
    upsert: false,
  })

  if (error) {
    return NextResponse.json({ error: error.message || "Failed to upload cover image." }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = storageClient.storage.from(BUCKET).getPublicUrl(filePath)

  return NextResponse.json({ publicUrl })
}
