import type { Thesis, TraineeProgram } from "./data/types"
export type DiscoveryTrack = "phd" | "master" | "trainee"
export const discoveryTracks = [
  { key: "phd", label: "PhD positions", href: "/phd-positions" },
  { key: "master", label: "Master’s theses", href: "/master-thesis?kind=master_thesis" },
  { key: "internship", label: "Internships", href: "/master-thesis?kind=internship" },
  { key: "trainee", label: "Graduate programs", href: "/trainee-programs" },
] as const
export function mapDiscoveryRecord(row: any): Thesis & TraineeProgram {
  return { ...row, opportunityKind: row.opportunity_kind, organizationType: row.organization_type,
    createdAt: row.created_at, postedBy: row.posted_by, postedByUserId: row.posted_by_user_id,
    externalUrl: row.external_url, organizationVerified: Boolean(row.profiles?.is_verified),
    verificationBadge: row.profiles?.verification_badge }
}
export const filterKeys = ["field", "location", "kind", "compensation", "deadline", "workMode", "organizationType"] as const
export type DiscoveryQuery = { search: string; sort: "newest" | "deadline" | "funded" | "recommended"; view: "grid" | "list"; filters: Record<string, string[]> }
export function parseDiscoveryQuery(query: string): DiscoveryQuery {
  const params = new URLSearchParams(query)
  const sort = params.get("sort")
  return { search: (params.get("q") || "").slice(0, 200), sort: sort === "deadline" || sort === "funded" ? sort : "newest", view: params.get("view") === "list" ? "list" : "grid", filters: Object.fromEntries(filterKeys.map(key => [key, params.getAll(key).filter(value => value.length > 0 && value.length <= 160).slice(0, 20)])) }
}
export function serializeDiscoveryQuery(query: DiscoveryQuery) {
  const params = new URLSearchParams()
  if (query.search) params.set("q", query.search)
  if (query.sort !== "newest") params.set("sort", query.sort)
  if (query.view !== "grid") params.set("view", query.view)
  for (const key of filterKeys) for (const value of query.filters[key] || []) params.append(key, value)
  return params.toString()
}
