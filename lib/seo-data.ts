import "server-only"

import { createClient } from "@supabase/supabase-js"

export type SeoThesis = {
  id: string
  title: string
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
}

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return null

  return createClient(url, key, {
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
  const pageSize = 1000

  for (let from = 0; from < 50000; from += pageSize) {
    const { data, error } = await loadPage(from, from + pageSize - 1)
    if (error || !data) break

    records.push(...data)
    if (data.length < pageSize) break
  }

  return records
}

export async function getSeoThesis(id: string, type?: "master" | "phd") {
  const client = getPublicClient()
  if (!client) return null

  let query = client
    .from("theses")
    .select("id, title, type, description, subject, organization, organization_type, location, compensation, deadline, external_url, created_at")
    .eq("id", id)
    .eq("status", "approved")

  if (type) query = query.eq("type", type)

  const { data } = await query.maybeSingle()
  return (data as SeoThesis | null) || null
}

export async function getSeoProgram(id: string) {
  const client = getPublicClient()
  if (!client) return null

  const { data } = await client
    .from("trainee_programs")
    .select("id, title, company, description, field, location, duration, compensation, deadline, external_url, created_at")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle()

  return (data as SeoProgram | null) || null
}

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

export async function getSeoIndexRecords() {
  const client = getPublicClient()
  if (!client) return { theses: [], programs: [], posts: [] }

  const today = new Date().toISOString().slice(0, 10)
  const [theses, programs, posts] = await Promise.all([
    collectPages<any>((from, to) =>
      client
        .from("theses")
        .select("id, type, title, description, organization, created_at, deadline")
        .eq("status", "approved")
        .gte("deadline", today)
        .range(from, to)
    ),
    collectPages<any>((from, to) =>
      client
        .from("trainee_programs")
        .select("id, title, description, company, created_at, deadline")
        .eq("status", "approved")
        .gte("deadline", today)
        .range(from, to)
    ),
    collectPages<any>((from, to) =>
      client
        .from("blog_posts")
        .select("slug, title, excerpt, author, created_at")
        .eq("status", "approved")
        .range(from, to)
    ),
  ])

  return {
    theses,
    programs,
    posts,
  }
}
