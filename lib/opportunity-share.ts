import { createClient } from "@supabase/supabase-js"
import { htmlToPlainText } from "@/lib/text"

export interface OpportunityShareData {
  id: string
  title: string
  description: string
  subject: string
  organization: string
  organizationType: "university" | "company"
  location: string
  deadline: string
  logoUrl?: string
}

function normalizeSiteUrl(value?: string) {
  if (!value) return "https://graduatescorner.com"
  return value.startsWith("http") ? value : `https://${value}`
}

type ShareProfile = {
  avatar?: string | null
  organization?: string | null
  type?: string | null
}

export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
)

function getPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!url || !key) return null

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function isUsableImageUrl(value?: string | null) {
  return Boolean(value && /^https?:\/\//i.test(value))
}

async function getOrganizationLogo(
  supabase: any,
  postedByUserId: string | null,
  organization: string,
  organizationType: "university" | "company"
) {
  if (postedByUserId) {
    const { data: posterData } = await supabase
      .from("profiles")
      .select("avatar, organization, type")
      .eq("id", postedByUserId)
      .maybeSingle()

    const poster = posterData as ShareProfile | null
    const isOrganizationProfile =
      poster?.type === organizationType ||
      poster?.organization?.trim().toLowerCase() === organization.trim().toLowerCase()

    if (isOrganizationProfile && isUsableImageUrl(poster?.avatar)) {
      return poster.avatar as string
    }
  }

  const { data: matchingProfileData } = await supabase
    .from("profiles")
    .select("avatar")
    .eq("type", organizationType)
    .ilike("organization", organization)
    .limit(3)

  const matchingProfiles = matchingProfileData as ShareProfile[] | null
  return matchingProfiles?.find((profile) => isUsableImageUrl(profile.avatar))?.avatar
}

export async function getPhdShareData(id: string): Promise<OpportunityShareData | null> {
  const supabase = getPublicSupabaseClient()
  if (!supabase) return null

  const { data } = await supabase
    .from("theses")
    .select("id, title, description, subject, organization, organization_type, location, deadline, posted_by_user_id")
    .eq("id", id)
    .eq("type", "phd")
    .eq("status", "approved")
    .maybeSingle()

  if (!data) return null

  const organizationType = data.organization_type === "company" ? "company" : "university"
  const logoUrl = await getOrganizationLogo(
    supabase,
    data.posted_by_user_id,
    data.organization,
    organizationType
  )

  return {
    id: data.id,
    title: data.title,
    description: htmlToPlainText(data.description).slice(0, 220),
    subject: data.subject,
    organization: data.organization,
    organizationType,
    location: data.location,
    deadline: data.deadline,
    logoUrl: logoUrl || undefined,
  }
}

export function getPhdShareImageUrl(id: string) {
  return new URL(`/phd-positions/${id}/opengraph-image`, siteUrl).toString()
}
