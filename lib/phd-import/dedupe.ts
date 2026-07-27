export type ExistingPhdIdentity = {
  id: string
  title: string | null
  organization: string | null
  deadline: string | null
  external_url: string | null
  external_id: string | null
  status?: string | null
}

export type PhdIdentityCandidate = {
  title: string
  organization: string
  deadline: string
  externalUrl: string
  externalId: string
}

export type PhdIdentityMatch = {
  thesis: ExistingPhdIdentity
  reason: "external_url" | "external_id" | "title_organization_deadline"
}

export function normalizeOpportunityText(value: string | null | undefined) {
  return (value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

export function normalizeOpportunityUrl(value: string | null | undefined) {
  const input = value?.trim()
  if (!input) return ""

  try {
    const url = new URL(input)
    url.hash = ""
    url.hostname = url.hostname.toLowerCase()
    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, "")
    }
    return url.toString()
  } catch {
    return input
  }
}

export function extractOpportunityId(value: string | null | undefined) {
  const input = value?.trim()
  if (!input) return null

  try {
    const url = new URL(input)
    const queryId = Array.from(url.searchParams.entries()).find(([key]) =>
      ["job_id", "rmjob", "query", "jid", "jobid"].includes(key.toLowerCase())
    )?.[1]
    if (queryId) return queryId.trim().toLowerCase()

    const decodedPath = decodeURIComponent(url.pathname)
    const varbiId = decodedPath.match(/jobID:(\d+)/i)?.[1]
    if (varbiId) return varbiId

    const pathId = decodedPath.match(/\/(\d+)\/?$/)?.[1]
    if (pathId) return pathId
  } catch {
    // Raw external IDs are handled by the caller.
  }

  return null
}

function normalizedExternalId(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase()
  return normalized || null
}

export function findExistingPhdMatch(
  candidate: PhdIdentityCandidate,
  existingPhds: ExistingPhdIdentity[]
): PhdIdentityMatch | null {
  const candidateUrl = normalizeOpportunityUrl(candidate.externalUrl)
  const urlMatch = existingPhds.find(
    (thesis) =>
      candidateUrl &&
      normalizeOpportunityUrl(thesis.external_url) === candidateUrl
  )
  if (urlMatch) return { thesis: urlMatch, reason: "external_url" }

  const candidateOrganization = normalizeOpportunityText(candidate.organization)
  if (!candidateOrganization) return null

  const candidateIds = new Set(
    [
      normalizedExternalId(candidate.externalId),
      extractOpportunityId(candidate.externalUrl),
    ].filter((value): value is string => Boolean(value))
  )

  if (candidateIds.size > 0) {
    const idMatch = existingPhds.find((thesis) => {
      if (normalizeOpportunityText(thesis.organization) !== candidateOrganization) {
        return false
      }

      const thesisIds = [
        normalizedExternalId(thesis.external_id),
        extractOpportunityId(thesis.external_url),
      ].filter((value): value is string => Boolean(value))

      return thesisIds.some((value) => candidateIds.has(value))
    })

    if (idMatch) return { thesis: idMatch, reason: "external_id" }
  }

  const candidateTitle = normalizeOpportunityText(candidate.title)
  if (candidateTitle.length < 12 || !candidate.deadline) return null

  const fallbackMatch = existingPhds.find((thesis) => {
    if (normalizeOpportunityText(thesis.organization) !== candidateOrganization) {
      return false
    }

    const thesisIds = [
      normalizedExternalId(thesis.external_id),
      extractOpportunityId(thesis.external_url),
    ].filter((value): value is string => Boolean(value))
    if (
      candidateIds.size > 0 &&
      thesisIds.length > 0 &&
      thesisIds.every((value) => !candidateIds.has(value))
    ) {
      return false
    }

    return (
      normalizeOpportunityText(thesis.title) === candidateTitle &&
      thesis.deadline === candidate.deadline
    )
  })

  return fallbackMatch
    ? { thesis: fallbackMatch, reason: "title_organization_deadline" }
    : null
}
