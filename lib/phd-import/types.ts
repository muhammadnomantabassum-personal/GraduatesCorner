export type PhdSourcePlatform = "html" | "feed" | "sitemap"

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
