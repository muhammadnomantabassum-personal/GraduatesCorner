import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient, isAdminRequest } from "@/lib/admin-server"
import { toNullableUuid } from "@/lib/uuid"

const compensationValues = new Set(["paid", "unpaid", "stipend"])
const organizationTypes = new Set(["university", "company"])

type PhdImportRow = {
  title: string
  type: "phd"
  subject: string
  description: string
  location: string
  deadline: string
  compensation: string
  external_url: string
  organization: string
  organization_type: string
  posted_by: "admin"
  posted_by_user_id: string | null
  status: "approved"
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
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
  const candidates = Array.isArray(body?.candidates) ? body.candidates : []
  const postedByUserId = toNullableUuid(body?.adminUserId)

  const rows = candidates
    .map((candidate: any) => {
      const compensation = text(candidate.compensation, "paid")
      const organizationType = text(candidate.organizationType, "university")

      return {
        title: text(candidate.title),
        type: "phd",
        subject: text(candidate.subject, "Research"),
        description: text(candidate.description),
        location: text(candidate.location, "Not specified"),
        deadline: text(candidate.deadline),
        compensation: compensationValues.has(compensation) ? compensation : "paid",
        external_url: text(candidate.externalUrl),
        organization: text(candidate.organization, "External organization"),
        organization_type: organizationTypes.has(organizationType) ? organizationType : "university",
        posted_by: "admin",
        posted_by_user_id: postedByUserId,
        status: "approved",
      }
    })
    .filter((row: PhdImportRow) => row.title && row.description && row.deadline && row.external_url)

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid PhD positions were selected for import." }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from("theses")
    .insert(rows)
    .select("id, title, external_url")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ imported: data || [], count: data?.length || 0 })
}
