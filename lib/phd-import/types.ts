export type PhdSourcePlatform = "html" | "feed" | "sitemap" | "json"

export type PhdSourceAdapter =
  | "standard"
  | "academictransfer-api"
  | "jobbnorge-api"
  | "talentadore-json"

export type PhdImportOrganizationDefinition = {
  name: string
  aliases: string[]
  defaultLocation: string
}

export type PhdImportSourceDefinition = {
  id: string
  name: string
  organization: string
  country: string
  defaultLocation: string
  sourceUrl: string
  publicUrl: string
  platform: PhdSourcePlatform
  allowedHosts: string[]
  detailUrlPrefix?: string
  adapter?: PhdSourceAdapter
  jobUrlPattern?: RegExp
  listingPageCount?: number
  listingPageParameter?: string
  listingPageStart?: number
  maxJobs?: number
  maxListingBytes?: number
  organizations?: PhdImportOrganizationDefinition[]
}

export type PhdImportCandidate = {
  externalId: string
  title: string
  organization: string
  location: string
  subject: string
  description: string
  deadline: string
  publishedAt: string | null
  compensation: "paid" | "unpaid" | "stipend"
  externalUrl: string
  sourceId: string
  sourceName: string
  sourceMetadata: Record<string, unknown>
}

export type PhdSourceDatabaseRow = {
  id: string
  enabled: boolean
  auto_publish: boolean
}

export type PhdImportRunResult = {
  sourceId: string
  sourceName: string
  status: "succeeded" | "partial" | "failed"
  found: number
  added: number
  duplicates: number
  published: number
  errors: number
  message?: string
}
