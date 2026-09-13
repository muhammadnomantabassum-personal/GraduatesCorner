import type { OpportunityKind } from "./identity"
export type EmployerCursor = { query: number; offset: number; pageUrl?: string; retry?: number }
export type EmployerCandidate = {
  externalId: string
  url: string
  title: string
  kind: OpportunityKind
  organization: string
  location: string
  description: string
  field: string
  deadline: string | null
  compensation: "paid" | "unpaid" | "stipend" | null
  duration: string
  publishedAt: string | null
}
export type ListingJob = {
  id: string; url: string; title: string; location?: string; detailUrl?: string; description?: string
  deadline?: string; publishedAt?: string; country?: string
  organization?: string
}
