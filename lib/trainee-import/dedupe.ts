export type ExistingTraineeIdentity = {
  id: string
  title: string
  company: string
  deadline: string
  external_url: string | null
  external_id: string | null
  status: string
}

export type TraineeIdentityCandidate = {
  title: string
  company: string
  deadline: string
  externalUrl: string
  externalId: string
}

export type TraineeIdentityMatch = {
  program: ExistingTraineeIdentity
  reason: "external_url" | "external_id" | "title_company_deadline"
}

export function normalizeTraineeText(value: string | null | undefined) {
  return (value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

export function normalizeTraineeUrl(value: string | null | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    url.hash = ""
    for (const key of [...url.searchParams.keys()]) {
      if (/^(?:utm_|ref$|source$|campaign$|cmp$|cmpid$)/i.test(key)) url.searchParams.delete(key)
    }
    const query = url.searchParams.toString()
    const path = url.pathname.replace(/\/+$/, "") || "/"
    return `${url.protocol}//${url.hostname.toLowerCase()}${path}${query ? `?${query}` : ""}`.toLowerCase()
  } catch {
    return value.trim().replace(/\/+$/, "").toLowerCase() || null
  }
}

export function extractTraineeOpportunityId(value: string | null | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    const queryId = [...url.searchParams.entries()].find(([key]) =>
      ["job_id", "jobid", "jid", "id"].includes(key.toLowerCase())
    )?.[1]
    if (queryId) return queryId.trim().toLowerCase()

    const pathId = decodeURIComponent(url.pathname).match(/(?:job|jobs)[^0-9]*(\d{4,})(?:\D|$)/i)?.[1]
      || decodeURIComponent(url.pathname).match(/\/(\d{4,})(?:\/|$)/)?.[1]
      || decodeURIComponent(url.pathname).match(/(?:-|job)(\d{6,})(?:\/|$)/i)?.[1]
    return pathId?.toLowerCase() || null
  } catch {
    return null
  }
}

function normalizedId(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null
}

export function findExistingTraineeMatch(
  candidate: TraineeIdentityCandidate,
  existingPrograms: ExistingTraineeIdentity[]
): TraineeIdentityMatch | null {
  const candidateUrl = normalizeTraineeUrl(candidate.externalUrl)
  const urlMatch = existingPrograms.find(
    (program) => candidateUrl && normalizeTraineeUrl(program.external_url) === candidateUrl
  )
  if (urlMatch) return { program: urlMatch, reason: "external_url" }

  const company = normalizeTraineeText(candidate.company)
  const candidateIds = new Set(
    [normalizedId(candidate.externalId), extractTraineeOpportunityId(candidate.externalUrl)]
      .filter((value): value is string => Boolean(value))
  )

  if (company && candidateIds.size) {
    const idMatch = existingPrograms.find((program) => {
      if (normalizeTraineeText(program.company) !== company) return false
      return [normalizedId(program.external_id), extractTraineeOpportunityId(program.external_url)]
        .filter((value): value is string => Boolean(value))
        .some((value) => candidateIds.has(value))
    })
    if (idMatch) return { program: idMatch, reason: "external_id" }
  }

  const title = normalizeTraineeText(candidate.title)
  if (!company || title.length < 8 || !candidate.deadline) return null
  const fallback = existingPrograms.find((program) =>
    normalizeTraineeText(program.company) === company
    && normalizeTraineeText(program.title) === title
    && program.deadline === candidate.deadline
  )

  return fallback ? { program: fallback, reason: "title_company_deadline" } : null
}
