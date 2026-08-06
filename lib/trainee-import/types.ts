export type TraineeSourcePlatform = "html" | "json" | "wordpress"

export type TraineeSourceAdapter =
  | "traineeguiden-wordpress"
  | "graduateships-ajax"
  | "targetjobs-html"
  | "higherin-state"
  | "milkround-html"

export type TraineeImportSourceDefinition = {
  id: string
  name: string
  organization: string
  country: string
  defaultLocation: string
  sourceUrl: string
  publicUrl: string
  platform: TraineeSourcePlatform
  adapter?: TraineeSourceAdapter
  allowedHosts: string[]
  listingPageCount?: number
  maxJobs?: number
  maxListingBytes?: number
  crawlDelayMs?: number
  scannable: boolean
  accessNote?: string
}

export type TraineeImportCandidate = {
  externalId: string
  title: string
  company: string
  location: string
  field: string
  description: string
  duration: string
  compensation: "paid" | "unpaid" | "stipend"
  deadline: string
  publishedAt: string | null
  externalUrl: string
  sourceId: string
  sourceName: string
  sourceMetadata: Record<string, unknown>
}

export type TraineeSourceDatabaseRow = {
  id: string
  enabled: boolean
  auto_publish: boolean
}

export type TraineeImportRunResult = {
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
