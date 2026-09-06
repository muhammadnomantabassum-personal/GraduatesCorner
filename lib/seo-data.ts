import "server-only"
import { cache } from "react"
import { opportunityId } from "./opportunity-url"

import { createClient } from "@supabase/supabase-js"

export type SeoThesis = {
  id: string
  title: string
  opportunity_kind?: "master_thesis" | "internship"
  type: "master" | "phd"
  description: string
  subject: string
  organization: string
  organization_type: "university" | "company"
  location: string
  compensation: "paid" | "unpaid" | "stipend"
  deadline: string
  external_url: string | null
  created_at: string
  source_published_at?: string | null
}

export type SeoProgram = {
  id: string
  title: string
  company: string
  description: string
  field: string
  location: string
  duration: string
  compensation: "paid" | "unpaid" | "stipend"
  deadline: string
  external_url: string | null
  created_at: string
  source_published_at?: string | null
}

export type SeoBlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  category: string
  cover_image: string | null
  created_at: string
  source_published_at?: string | null
}

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return null

  return createClient(url, key, {
    global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 300, tags: ["public-opportunities"] } }) },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function collectPages<T>(
  loadPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
) {
  const records: T[] = []
  // Keep each cached response below Next's per-entry limit, even with long descriptions.
  const pageSize = 100

  for (let from = 0; from < 50000; from += pageSize) {
    const { data, error } = await loadPage(from, from + pageSize - 1)
    if (error) throw new Error("Unable to load the public search index")
    if (!data) break

    records.push(...data)
    if (data.length < pageSize) break
  }

  return records
}

export const getSeoThesis = cache(async (value: string, type?: "master" | "phd") => {
  const id = opportunityId(value)
  if (!id) return null
  const client = getPublicClient()
  if (!client) return null

  let query = client
    .from("theses")
    .select("id, title, type, opportunity_kind, description, subject, organization, organization_type, location, compensation, deadline, external_url, created_at, source_published_at")
    .eq("id", id)
    .eq("status", "approved")

  if (type) query = query.eq("type", type)

  const { data, error } = await query.maybeSingle()
  if (error) throw new Error("Unable to load public opportunity")
  return (data as SeoThesis | null) || null
})

export const getSeoProgram = cache(async (value: string) => {
  const id = opportunityId(value)
  if (!id) return null
  const client = getPublicClient()
  if (!client) return null

  const { data, error } = await client
    .from("trainee_programs")
    .select("id, title, company, description, field, location, duration, compensation, deadline, external_url, created_at, source_published_at")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle()

  if (error) throw new Error("Unable to load public program")
  return (data as SeoProgram | null) || null
})

export async function getSeoBlogPost(slug: string) {
  const client = getPublicClient()
  if (!client) return null

  const { data } = await client
    .from("blog_posts")
    .select("id, slug, title, excerpt, content, author, category, cover_image, created_at")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle()

  return (data as SeoBlogPost | null) || null
}

export const getRelatedOpportunities = cache(async (id:string,kind:"master"|"phd"|"trainee") => {
  const client=getPublicClient()
  if(!client) return []
  let query=client.from(kind==="trainee"?"trainee_programs":"theses").select(kind==="trainee"?"id,title,company":"id,title,organization")
    .eq("status","approved").gte("deadline",new Date().toISOString().slice(0,10)).neq("id",id).order("created_at",{ascending:false}).order("id").limit(3)
  if(kind!=="trainee") query=query.eq("type",kind)
  const {data,error}=await query
  if(error) throw new Error("Unable to load related opportunities")
  return (data||[]).map((item:any)=>({id:item.id,title:item.title,organization:item.organization||item.company}))
})

export const getSeoIndexRecords = cache(async () => {
  const client = getPublicClient()
  if (!client) return { theses: [], programs: [], posts: [] }

  const today = new Date().toISOString().slice(0, 10)
  const [theses, programs, posts] = await Promise.all([
    collectPages<any>((from, to) =>
      client
        .from("theses")
        .select("id, type, opportunity_kind, title, description, subject, organization, organization_type, location, compensation, external_url, created_at, source_published_at, deadline")
        .eq("status", "approved")
        .gte("deadline", today)
        .order("id")
        .range(from, to)
    ),
    collectPages<any>((from, to) =>
      client
        .from("trainee_programs")
        .select("id, title, description, company, field, location, duration, compensation, external_url, created_at, source_published_at, deadline")
        .eq("status", "approved")
        .gte("deadline", today)
        .order("id")
        .range(from, to)
    ),
    collectPages<any>((from, to) =>
      client
        .from("blog_posts")
        .select("slug, title, excerpt, author, created_at")
        .eq("status", "approved")
        .order("id")
        .range(from, to)
    ),
  ])

  return {
    theses,
    programs,
    posts,
  }
})
