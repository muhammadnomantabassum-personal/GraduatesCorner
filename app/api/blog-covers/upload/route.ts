import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isAdminRequest } from "@/lib/admin-server"

const MAX_UPLOAD_SIZE = 2 * 1024 * 1024
const BUCKET = "blog-covers"

function detectImageType(buffer: Buffer) {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { extension: "png", contentType: "image/png" }
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: "jpg", contentType: "image/jpeg" }
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { extension: "webp", contentType: "image/webp" }
  }

  return null
}

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

  const isAdmin = await isAdminRequest(request)
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null
  let actorId = isAdmin ? "admin" : ""

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

  if (file.size === 0) {
    return NextResponse.json({ error: "The uploaded image is empty." }, { status: 400 })
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: "Image is too large after optimization." }, { status: 400 })
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const detectedType = detectImageType(fileBuffer)

  if (!detectedType) {
    return NextResponse.json(
      { error: "The uploaded file is not a valid PNG, JPEG, or WebP image." },
      { status: 400 }
    )
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
  const filePath = `${actorId}/blog-cover-${crypto.randomUUID()}.${detectedType.extension}`

  const { error } = await storageClient.storage.from(BUCKET).upload(filePath, fileBuffer, {
    cacheControl: "31536000",
    contentType: detectedType.contentType,
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
