import { isoDeadline } from "./identity"

const months = [
  "jan january januar januari januari tammikuu tammikuuta",
  "feb february februar februari helmikuu helmikuuta",
  "mar march mars marz maart maaliskuu maaliskuuta",
  "apr april huhtikuu huhtikuuta",
  "may mai maj mei toukokuu toukokuuta",
  "jun june juni kesakuu kesakuuta",
  "jul july juli heinakuu heinakuuta",
  "aug august augusti augustus elokuu elokuuta",
  "sep sept september syyskuu syyskuuta",
  "oct october oktober lokakuu lokakuuta",
  "nov november marraskuu marraskuuta",
  "dec december desember dezember joulukuu joulukuuta",
]
const normalize = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ø/g, "o").replace(/æ/g, "ae").replace(/\u00a0/g, " ")
const monthMap = new Map(months.flatMap((names, index) => names.split(" ").map(name => [name, String(index + 1).padStart(2, "0")] as const)))
const monthPattern = [...monthMap.keys()].sort((a, b) => b.length - a.length).join("|")

export function parseEmployerDate(value: unknown): string | null {
  if (typeof value !== "string") return null
  const exact = isoDeadline(value)
  if (exact) return exact
  const normalized = normalize(value).replace(/(\d)(st|nd|rd|th)\b/g, "$1")
  const iso = normalized.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})(?!\d)/)
  if (iso) return isoDeadline(`${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`)
  const numeric = normalized.match(/\b(\d{1,2})[/.](\d{1,2})[/.](20\d{2})\b/)
  if (numeric) return isoDeadline(`${numeric[3]}-${numeric[2].padStart(2, "0")}-${numeric[1].padStart(2, "0")}`)
  const dmy = normalized.match(new RegExp(`\\b(\\d{1,2})[\\s.,/-]+(${monthPattern})[\\s.,/-]+(20\\d{2})\\b`))
  if (dmy) return isoDeadline(`${dmy[3]}-${monthMap.get(dmy[2])}-${dmy[1].padStart(2, "0")}`)
  const mdy = normalized.match(new RegExp(`\\b(${monthPattern})[\\s.]+(\\d{1,2})[\\s,]+(20\\d{2})\\b`))
  return mdy ? isoDeadline(`${mdy[3]}-${monthMap.get(mdy[1])}-${mdy[2].padStart(2, "0")}`) : null
}

export function extractEmployerDeadline(value: string): string | null {
  const normalized = normalize(value).replace(/\s+/g, " ")
  const labels = /\b(?:last application date|last day to apply|application deadline|application period ends|applications? (?:close[sd]?|must be submitted by)|closing date(?: for applications?)?|apply (?:by|before)|deadline|no later than|sista ansokningsdag|sista ansokningsdatum|ansok senast|ansokningstiden slutar|soknadsfrist|ansogningsfrist|hakuaika paattyy|bewerbungsfrist|bewerbungsschluss|solliciteer (?:voor|uiterlijk))\s*:?\s*(?:on\s+)?([^|]{4,90})/g
  for (const match of normalized.matchAll(labels)) {
    const context = match[1].split(/\b(?:start date|starting|published|posted|salary|location)\b/)[0]
    if (/^(?:not specified|not provided|open until filled|rolling|ongoing|as soon as possible)/.test(context)) continue
    const date = parseEmployerDate(context)
    if (date) return date
  }
  return null
}
