const MAX_FIELDS = 5

const fieldRules: Array<{ field: string; pattern: RegExp }> = [
  { field: "Technology and Software", pattern: /\b(?:software|developer|technology|digital|cloud|cyber|information technology|it\b|computer)/i },
  { field: "Data and Analytics", pattern: /\b(?:data|analytics|artificial intelligence|machine learning|ai\b|business intelligence|statistics)/i },
  { field: "Engineering", pattern: /\b(?:engineer|engineering|mechanical|electrical|electronics|civil|manufacturing|aerospace|automation)/i },
  { field: "Finance and Accounting", pattern: /\b(?:finance|financial|accounting|accountant|audit|banking|investment|risk|actuarial|tax)/i },
  { field: "Business and Management", pattern: /\b(?:business|management|commercial|leadership|strategy|operations|project management)/i },
  { field: "Consulting", pattern: /\b(?:consulting|consultant|advisory)/i },
  { field: "Sales", pattern: /\b(?:sales|business development|account management|recruitment consultant)/i },
  { field: "Marketing and Communications", pattern: /\b(?:marketing|communications?|public affairs|brand|content|media|advertising|public relations)/i },
  { field: "Human Resources", pattern: /\b(?:human resources|hr\b|people and culture|talent acquisition|recruitment)/i },
  { field: "Law", pattern: /\b(?:legal|law\b|solicitor|barrister|compliance)/i },
  { field: "Supply Chain and Logistics", pattern: /\b(?:supply chain|logistics|procurement|sourcing|purchasing)/i },
  { field: "Science and Healthcare", pattern: /\b(?:science|scientific|health|medical|pharma|biotech|laboratory|life sciences)/i },
  { field: "Energy and Sustainability", pattern: /\b(?:energy|sustainability|renewable|climate|environment|power grid|utilities)/i },
  { field: "Construction and Property", pattern: /\b(?:construction|property|surveying|surveyor|real estate|architecture)/i },
  { field: "Public Sector", pattern: /\b(?:public sector|government|civil service|authority|municipality)/i },
]

export function inferTraineeFields(title: string, bodyText = "", hints: string[] = []) {
  const fields: string[] = []
  for (const input of [title, hints.join(" "), bodyText.slice(0, 1_500)]) {
    for (const rule of fieldRules) {
      if (rule.pattern.test(input) && !fields.includes(rule.field)) fields.push(rule.field)
      if (fields.length >= MAX_FIELDS) break
    }
    if (fields.length >= MAX_FIELDS) break
  }
  return (fields.length ? fields : ["Graduate and Trainee Programmes"]).slice(0, MAX_FIELDS)
}

export function inferDuration(value: string) {
  const match = [
    /\b(\d{1,2})\s*[- ]?\s*(month|months|year|years)\s+(?:graduate|trainee|training|development|rotation)\s*(?:scheme|program|programme)?\b/i,
    /\b(?:graduate|trainee)\s+(?:scheme|program|programme)\s+(?:runs?|lasts?|spans?|is|duration(?: is)?|of)\s+(?:for\s+)?(\d{1,2})\s*[- ]?\s*(month|months|year|years)\b/i,
    /\b(?:scheme|program|programme)\s+(?:runs?|lasts?|spans?|is|duration(?: is)?|of)\s+(?:for\s+)?(\d{1,2})\s*[- ]?\s*(month|months|year|years)\b/i,
    /\b(?:duration|program length|programme length)\s*:?\s*(\d{1,2})\s*[- ]?\s*(month|months|year|years)\b/i,
  ].map((pattern) => value.match(pattern)).find((result): result is RegExpMatchArray => Boolean(result))
  if (!match) return "Not specified"
  const amount = Number(match[1])
  const unit = match[2].toLowerCase().startsWith("year") ? "year" : "month"
  return `${amount} ${unit}${amount === 1 ? "" : "s"}`
}

export function inferCompensation(value: string): "paid" | "unpaid" | "stipend" {
  if (/\bunpaid\b/i.test(value)) return "unpaid"
  if (/\bstipend|scholarship\b/i.test(value)) return "stipend"
  return "paid"
}

export { MAX_FIELDS }
