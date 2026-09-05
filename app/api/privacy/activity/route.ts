import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/admin-server"

const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie" }

export async function DELETE(request: NextRequest) {
  // Cookie-authenticated destructive operations require a same-origin request.
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403, headers })
  }
  try {
    const session = await createClient()
    const { data: { user }, error } = await session.auth.getUser()
    if (error || !user) return NextResponse.json({ error: "Sign in required" }, { status: 401, headers })
    const body = await request.json().catch(() => null)
    if (body?.category !== "wishlist" && body?.category !== "applications") {
      return NextResponse.json({ error: "Choose saved opportunities or application markers" }, { status: 400, headers })
    }
    const db = createAdminClient()
    if (!db) return NextResponse.json({ error: "Data management unavailable" }, { status: 503, headers })
    const { error: deleteError } = await db.from(body.category).delete().eq("user_id", user.id)
    if (deleteError) throw new Error("Deletion failed")
    return NextResponse.json({ success: true }, { headers })
  } catch {
    return NextResponse.json({ error: "Unable to clear this data. Please try again or contact admin@graduatescorner.com." }, { status: 500, headers })
  }
}
