import { NextResponse, type NextRequest } from "next/server"
import { isAdminRequest } from "@/lib/admin-server"
import { getTrafficAnalytics, isGoogleAnalyticsConfigured } from "@/lib/google-analytics-server"
import { internalErrorResponse } from "@/lib/server-error"

const allowedRanges = new Set([7, 30, 90])

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isGoogleAnalyticsConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        message: "Traffic analytics is ready and waiting for the Google Analytics property connection.",
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  }

  const requestedDays = Number(request.nextUrl.searchParams.get("days") || 30)
  const days = allowedRanges.has(requestedDays) ? requestedDays : 30

  try {
    const data = await getTrafficAnalytics(days)
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    return internalErrorResponse(
      "traffic analytics",
      error,
      "Traffic analytics could not be loaded. Check the Google Analytics connection."
    )
  }
}
