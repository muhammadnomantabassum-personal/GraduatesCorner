import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/admin-server"

export const dynamic = "force-dynamic"
const headers = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" }

export async function GET() {
  try {
    const session = await createClient()
    const { data: { user }, error } = await session.auth.getUser()
    if (error || !user) return NextResponse.json({ error: "Sign in required" }, { status: 401, headers })
    const db = createAdminClient()
    if (!db) return NextResponse.json({ error: "Data download unavailable" }, { status: 503, headers })
    // The verified session is the only source of the subject ID. Never accept a client ID.
    const tables = [
      ["profiles", "id", "id,name,email,type,organization,bio,avatar,created_at,is_verified,verified_at,verification_badge,welcome_email_sent"],
      ["wishlist", "user_id", "*"], ["applications", "user_id", "*"],
      ["blog_posts", "posted_by_user_id", "*"], ["blog_comments", "user_id", "*"],
      ["testimonials", "user_id", "*"], ["theses", "posted_by_user_id", "*"],
      ["trainee_programs", "posted_by_user_id", "*"],
    ] as const
    const records: Record<string, unknown[]> = {}
    for (const [table, column, fields] of tables) {
      records[table] = []
      // Paginate rather than silently truncating at the provider's row limit.
      for (let offset = 0; ; offset += 100) {
        const { data, error: queryError } = await db.from(table).select(fields).eq(column, user.id).order("id").range(offset, offset + 99)
        if (queryError || !data) throw new Error("Export query failed")
        records[table].push(...data)
        if (data.length < 100) break
      }
    }
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      account: { id: user.id, email: user.email, phone: user.phone, createdAt: user.created_at, lastSignInAt: user.last_sign_in_at },
      records,
      scope: "Account and application records. Contact admin@graduatescorner.com for uploaded files, correspondence, and a full access request.",
    }, { headers: { ...headers, "Content-Disposition": 'attachment; filename="graduates-corner-data.json"' } })
  } catch {
    return NextResponse.json({ error: "Unable to prepare your download. Contact admin@graduatescorner.com." }, { status: 500, headers })
  }
}
