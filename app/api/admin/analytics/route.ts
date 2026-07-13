import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient, isAdminRequest } from "@/lib/admin-server"
import { internalErrorResponse } from "@/lib/server-error"

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: "Admin API is not configured." }, { status: 500 })
  }

  const [profiles, theses, programs, blogs, testimonials] = await Promise.all([
    adminClient.from("profiles").select("type, created_at").limit(1000),
    adminClient.from("theses").select("type, status, compensation, created_at").limit(1000),
    adminClient.from("trainee_programs").select("status, compensation, created_at").limit(1000),
    adminClient.from("blog_posts").select("status, category, created_at").limit(1000),
    adminClient.from("testimonials").select("status, rating, created_at").limit(1000),
  ])

  const firstError = [profiles, theses, programs, blogs, testimonials].find((result) => result.error)?.error

  if (firstError) {
    return internalErrorResponse("admin analytics", firstError, "Unable to load analytics.")
  }

  return NextResponse.json({
    profiles: profiles.data || [],
    theses: theses.data || [],
    programs: programs.data || [],
    blogs: blogs.data || [],
    testimonials: testimonials.data || [],
  })
}
