import type {
  PhdImportOrganizationDefinition,
  PhdImportSourceDefinition,
} from "./types"

const MAX_RESEARCH_FIELDS = 5

function normalizeClassificationText(value: string | null | undefined) {
  return (value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

const fieldRules: Array<{ field: string; pattern: RegExp }> = [
  {
    field: "Artificial Intelligence",
    pattern: /\b(?:artificial intelligence|machine learning|deep learning|neural network|computer vision|natural language processing|generative ai)\b/i,
  },
  {
    field: "Data Science",
    pattern: /\b(?:data science|data analytics|big data|statistical learning|bioinformatics|computational biology)\b/i,
  },
  {
    field: "Computer Science",
    pattern: /\b(?:computer science|software engineering|cybersecurity|information systems|human-computer interaction|algorithms?|computing)\b/i,
  },
  {
    field: "Robotics and Automation",
    pattern: /\b(?:robotics?|automation|autonomous systems?|control systems?|mechatronics)\b/i,
  },
  {
    field: "Electrical Engineering",
    pattern: /\b(?:electrical engineering|electronics|telecommunications?|wireless|signal processing|power systems?|semiconductor)\b/i,
  },
  {
    field: "Mechanical Engineering",
    pattern: /\b(?:mechanical engineering|mechanics|manufacturing|thermodynamics|fluid dynamics|aerospace)\b/i,
  },
  {
    field: "Materials Science",
    pattern: /\b(?:materials? science|nanomaterials?|polymers?|metallurgy|composites?|surface science)\b/i,
  },
  {
    field: "Civil Engineering",
    pattern: /\b(?:civil engineering|structural engineering|construction|geotechnical|transport infrastructure|hydraulic engineering)\b/i,
  },
  {
    field: "Energy",
    pattern: /\b(?:energy systems?|renewable energy|battery|batteries|hydrogen|photovoltaic|power electronics)\b/i,
  },
  {
    field: "Medical Sciences",
    pattern: /\b(?:medicine|medical|clinical|public health|epidemiology|radiology|surgery|psychiatry)\b/i,
  },
  {
    field: "Neuroscience",
    pattern: /\b(?:neuroscience|neurology|neuroimaging|brain|cognitive neuroscience)\b/i,
  },
  {
    field: "Cancer Research",
    pattern: /\b(?:cancer|oncology|tumou?r|carcinoma)\b/i,
  },
  {
    field: "Life Sciences",
    pattern: /\b(?:biology|life science|biomedical|biochemistry|biotechnology|molecular biology|cell biology|microbiology|genetics|genomics|proteomics|immunology)\b/i,
  },
  {
    field: "Chemistry",
    pattern: /\b(?:chemistry|chemical sciences?|catalysis|electrochemistry|organic chemistry|inorganic chemistry)\b/i,
  },
  {
    field: "Physics",
    pattern: /\b(?:physics|astronomy|astrophysics|optics|photonics|quantum|condensed matter)\b/i,
  },
  {
    field: "Mathematics",
    pattern: /\b(?:mathematics|applied mathematics|numerical analysis|optimization|geometry|algebra)\b/i,
  },
  {
    field: "Statistics",
    pattern: /\b(?:statistics|statistical methods?|biostatistics|probability)\b/i,
  },
  {
    field: "Economics",
    pattern: /\b(?:economics|econometrics|macroeconomics|microeconomics|economic policy)\b/i,
  },
  {
    field: "Business and Management",
    pattern: /\b(?:business|management|finance|accounting|marketing|entrepreneurship|organization studies)\b/i,
  },
  {
    field: "Psychology",
    pattern: /\b(?:psychology|psychological|behavio[u]?ral science|cognition)\b/i,
  },
  {
    field: "Social Sciences",
    pattern: /\b(?:social science|sociology|political science|public policy|anthropology|migration|international relations|development studies)\b/i,
  },
  {
    field: "Education",
    pattern: /\b(?:education|pedagogy|teaching and learning|didactics)\b/i,
  },
  {
    field: "Media and Communication",
    pattern: /\b(?:media studies|communication|journalism|digital media)\b/i,
  },
  {
    field: "Environmental Sciences",
    pattern: /\b(?:environment|environmental science|climate|sustainability|ecology|biodiversity|earth science|geoscience)\b/i,
  },
  {
    field: "Agricultural Sciences",
    pattern: /\b(?:agriculture|agricultural|forestry|food science|animal science|plant science|soil science)\b/i,
  },
  {
    field: "Law",
    pattern: /\b(?:law|legal studies|jurisprudence|criminology)\b/i,
  },
  {
    field: "Humanities",
    pattern: /\b(?:humanities|history|philosophy|linguistics|language|literature|religious studies|archaeology|cultural studies)\b/i,
  },
]

const fieldAliases = new Map(
  [
    ["behaviour and society", "Social Sciences"],
    ["behavior and society", "Social Sciences"],
    ["language and culture", "Humanities"],
    ["natural sciences", "Natural Sciences"],
    ["health", "Medical Sciences"],
    ["engineering", "Engineering"],
    ["computer science", "Computer Science"],
    ["economics", "Economics"],
    ["law", "Law"],
  ].map(([value, field]) => [normalizeClassificationText(value), field])
)

function cleanExplicitField(value: string) {
  const cleaned = value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s:;,.|-]+|[\s:;,.|-]+$/g, "")
    .replace(/\b(?:job types?|discipline|category)\b.*$/i, "")
    .trim()

  if (cleaned.length < 2 || cleaned.length > 70) return null
  return fieldAliases.get(normalizeClassificationText(cleaned)) || cleaned
}

function extractExplicitFields(bodyText: string) {
  const labelled = bodyText.match(
    /(?:research fields?|scientific fields?|third-cycle subject(?: area)?|subject area)\s*:?\s*(.{2,350}?)(?=\s*(?:job types?|application|deadline|description|duties|qualifications|employment|location|salary|published)\s*:?|$)/i
  )?.[1]
  if (!labelled) return []

  return labelled
    .split(/\s*(?:;|\||\n|,\s*(?=[A-Z]))\s*/)
    .map(cleanExplicitField)
    .filter((field): field is string => Boolean(field))
}

function addUniqueField(fields: string[], field: string) {
  const normalized = normalizeClassificationText(field)
  if (!normalized || fields.some((value) => normalizeClassificationText(value) === normalized)) return
  if (fields.length < MAX_RESEARCH_FIELDS) fields.push(field)
}

export function inferResearchFields(title: string, bodyText: string, fieldHints: string[] = []) {
  const fields: string[] = []

  for (const hint of [...fieldHints, ...extractExplicitFields(bodyText)]) {
    const cleaned = cleanExplicitField(hint)
    if (cleaned) addUniqueField(fields, cleaned)
  }

  for (const rule of fieldRules) {
    if (rule.pattern.test(title)) addUniqueField(fields, rule.field)
  }

  if (fields.length < MAX_RESEARCH_FIELDS) {
    const introduction = bodyText.slice(0, 2_500)
    for (const rule of fieldRules) {
      if (rule.pattern.test(introduction)) addUniqueField(fields, rule.field)
    }
  }

  return fields.length > 0 ? fields.slice(0, MAX_RESEARCH_FIELDS) : ["Interdisciplinary Research"]
}

function aliasMatchScore(value: string, organization: PhdImportOrganizationDefinition) {
  const normalized = normalizeClassificationText(value)
  if (!normalized) return 0

  return organization.aliases.reduce((best, alias) => {
    const normalizedAlias = normalizeClassificationText(alias)
    if (!normalizedAlias) return best
    if (normalized === normalizedAlias) return Math.max(best, 1000 + normalizedAlias.length)
    if (normalized.includes(normalizedAlias)) return Math.max(best, normalizedAlias.length)
    return best
  }, 0)
}

export function resolveCoveredOrganization(
  source: PhdImportSourceDefinition,
  values: Array<string | null | undefined>
) {
  if (!source.organizations?.length) {
    return {
      name: source.organization,
      defaultLocation: source.defaultLocation,
    }
  }

  let best: { organization: PhdImportOrganizationDefinition; score: number } | null = null
  for (const organization of source.organizations) {
    const score = Math.max(...values.map((value) => aliasMatchScore(value || "", organization)))
    if (score > 0 && (!best || score > best.score)) {
      best = { organization, score }
    }
  }

  return best
    ? {
        name: best.organization.name,
        defaultLocation: best.organization.defaultLocation,
      }
    : null
}

export { MAX_RESEARCH_FIELDS }
