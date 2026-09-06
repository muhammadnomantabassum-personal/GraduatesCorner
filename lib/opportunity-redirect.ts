import { createClient } from "@supabase/supabase-js"
import { opportunityId, opportunityPath } from "./opportunity-url"

// Public routing metadata only. Bound memory and refresh titles within five minutes.
const routes = new Map<string, { path: string | null; expires: number }>()
export async function canonicalOpportunityRedirect(pathname: string) {
  const match = pathname.match(/^\/(phd-positions|theses|trainee-programs)\/([^/]+)$/)
  if (!match) return null
  const id = opportunityId(match[2])
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!id || !url || !key) return null
  const program = match[1] === "trainee-programs"
  const cacheKey = `${program ? "program" : "thesis"}:${id}`
  let entry = routes.get(cacheKey)
  if (!entry || entry.expires <= Date.now()) {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await client.from(program ? "trainee_programs" : "theses")
      .select(program ? "id,title,company" : "id,title,organization,type")
      .eq("id", id).eq("status", "approved").maybeSingle()
    if (error) return null
    const record = data as unknown as {id:string;title:string;company?:string;organization?:string;type?:"master"|"phd"} | null
    entry = { path: record ? opportunityPath(program ? "trainee" : record.type!, id, record.title, record.company || record.organization) : null, expires: Date.now() + (record ? 300000 : 15000) }
    if (routes.size >= 1000) routes.delete(routes.keys().next().value!)
    routes.set(cacheKey, entry)
  }
  // A master listing under /phd-positions should remain a genuine 404.
  if (match[1] === "phd-positions" && entry.path?.startsWith("/theses/")) return null
  return entry.path && entry.path !== pathname ? entry.path : null
}
