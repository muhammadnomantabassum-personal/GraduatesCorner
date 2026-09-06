export type OpportunityKind = "master_thesis" | "internship" | "trainee"

export function canonicalJobUrl(value: string) {
  const url = new URL(value)
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) throw new Error("Invalid public job URL")
  url.hash = ""
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_.+|source|src|ref|referrer|trackingid|lang|locale|gh_src)$/i.test(key)) url.searchParams.delete(key)
  }
  url.searchParams.sort()
  if (url.hostname.endsWith("myworkdayjobs.com")) url.pathname = url.pathname.replace(/^\/[a-z]{2}-[a-z]{2}\//i, "/").replace(/\/apply\/?$/i, "")
  if (url.hostname === "www.smartrecruiters.com") url.hostname = "jobs.smartrecruiters.com"
  if (url.hostname === "jobs.smartrecruiters.com") url.pathname = url.pathname.replace(/\/(\d+)-[^/]+$/, "/$1")
  url.pathname = url.pathname.replace(/\/+$/, "") || "/"
  return url.toString()
}

export function classifyEmployerTitle(title: string): OpportunityKind | null {
  const text = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  if (/\b(phd|doctoral|doktorand|postdoc|professor|dissertation)\b/.test(text)) return null
  const thesis = /\b(master['’]?s?\s*(thesis|theses|project)|masterarbeit|masteroppgave|examensarbete|exjobb|diplomarbeit|diplomityo|pro gradu|afstudeer|thesis|abschlussarbeit)\b/.test(text)
  if (thesis && !/non[- ]thesis/.test(text) && (!/\bbachelor/.test(text) || /\bmaster/.test(text))) return "master_thesis"
  if (/\b(intern(ship)?s?|praktik(ant|anten|um|umsplatz)?|stage|stagiair|harjoittelija|harjoittelu|sommerstudent|summer student|summer placement)\b/.test(text)) return "internship"
  if (/\b(trainee|traineeship|graduate\s+(?:[a-z]+\s+){0,3}(?:program(?:me)?|scheme)|future talent|early career\s+(?:program(?:me)?|scheme))\b/.test(text)) return "trainee"
  return null
}

export function isoDeadline(value: unknown): string | null {
  if (typeof value !== "string") return null
  // SuccessFactors exposes dates such as "Tue Nov 03 23:00:00 UTC 2026".
  const atsDate = value.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(?:\d{2}:\d{2}:\d{2}\s+UTC\s+)?(20\d{2})\b/i)
  if (atsDate) {
    const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(atsDate[1].toLowerCase()) + 1
    value = `${atsDate[3]}-${String(month).padStart(2, "0")}-${atsDate[2].padStart(2, "0")}`
  }
  const match = (value as string).match(/\b(20\d{2})-(\d{2})-(\d{2})(?=T|\b)/) || (value as string).match(/\b(\d{2})[/.](\d{2})[/.](20\d{2})\b/)
  if (!match) return null
  const [year, month, day] = match[1].length === 4 ? match.slice(1) : [match[3], match[2], match[1]]
  const date = `${year}-${month}-${day}`
  const parsed = new Date(`${date}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : null
}
