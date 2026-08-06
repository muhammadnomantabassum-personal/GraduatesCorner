import { inferDuration, inferTraineeFields } from "../lib/trainee-import/classify.ts"
import { findExistingTraineeMatch, normalizeTraineeUrl } from "../lib/trainee-import/dedupe.ts"
import { getTraineeImportSource, TRAINEE_IMPORT_SOURCES } from "../lib/trainee-import/sources.ts"

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(TRAINEE_IMPORT_SOURCES.length === 8, "Expected all eight requested trainee sources")
assert(TRAINEE_IMPORT_SOURCES.filter((source) => source.scannable).length === 4, "Expected four production-ready automated sources")
assert(getTraineeImportSource("eures")?.scannable === false, "EURES must remain permission-gated")
assert(getTraineeImportSource("gradcracker")?.scannable === false, "Gradcracker must remain permission-gated")
assert(getTraineeImportSource("milkround")?.scannable === false, "Milkround must remain paused while production requests time out")

assert(
  normalizeTraineeUrl("https://example.com/jobs/42/?utm_source=test") === "https://example.com/jobs/42",
  "Tracking parameters should not affect URL deduplication"
)

const existing = [{
  id: "program-1",
  title: "Technology Graduate Programme 2027",
  company: "Example Group",
  deadline: "2026-10-01",
  external_url: "https://example.com/jobs/graduate-42",
  external_id: "42",
  status: "approved",
}]

assert(
  findExistingTraineeMatch({
    title: "Technology Graduate Programme 2027",
    company: "Example Group",
    deadline: "2026-10-01",
    externalUrl: "https://example.com/jobs/graduate-42/",
    externalId: "42",
  }, existing)?.reason === "external_url",
  "Canonical URLs should prevent duplicate programs"
)

const fields = inferTraineeFields("Data and AI Engineering Graduate Programme", "cloud analytics")
assert(fields.includes("Technology and Software") && fields.includes("Data and Analytics"), "Expected multi-field classification")
assert(inferDuration("The graduate programme runs for 24 months.") === "24 months", "Expected duration extraction")
assert(inferDuration("The company has operated for 25 years.") === "Not specified", "Company history must not become program duration")

console.log("PASS trainee source registry, classification, and duplicate protection")
