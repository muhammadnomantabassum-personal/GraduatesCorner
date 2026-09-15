import assert from "node:assert/strict"
import { typescriptLoader } from "./employer-test-loader.mjs"
const load = typescriptLoader()
const { parseEmployerDate, extractEmployerDeadline } = load("lib/employer-import/deadline.ts")
for (const value of ["30 September 2027", "September 30th, 2027", "30.09.2027", "2027/9/30", "30 september 2027", "30 syyskuuta 2027"]) assert.equal(parseEmployerDate(value), "2027-09-30", value)
assert.equal(parseEmployerDate("31 February 2027"), null)
assert.equal(parseEmployerDate("29 February 2028"), "2028-02-29")
for (const label of ["Last application date", "Sista ansökningsdag", "Søknadsfrist", "Ansøgningsfrist", "Bewerbungsfrist", "Hakuaika päättyy", "Solliciteer uiterlijk"]) assert.equal(extractEmployerDeadline(`${label}: 30 September 2027`), "2027-09-30", label)
assert.equal(extractEmployerDeadline("Posted: 2027-08-01. Start date: 2027-09-30"), null)
assert.equal(extractEmployerDeadline("Deadline: rolling applications. Start date: 2027-09-30"), null)
assert.equal(extractEmployerDeadline("Application deadline: Not specified. Published 2027-09-30"), null)

const rows = ["ready", "missing", "closed", "failed", "ready-two", "ready-three"].map((id, index) => ({ id: String(index + 1), external_id: id, source_id: "volvo", canonical_url: `https://jobs.volvogroup.com/job/${id}`, title: "Master Thesis Engineering", kind: "master_thesis", status: "pending", deadline: "2099-01-01" }))
const published = []
const db = {
  from() {
    const filters = []; let limit = Infinity; let updates
    const q = {
      select() { return q }, order() { return q },
      limit(value) { limit = value; return q },
      eq(key, value) { filters.push(row => row[key] === value); return q },
      gt(key, value) { filters.push(row => row[key] > value); return q },
      in(key, values) { filters.push(row => values.includes(row[key])); return q },
      update(value) { updates = value; return q },
      async single() { return { data: rows.find(row => filters.every(filter => filter(row))), error: null } },
      then(resolve) { const data = rows.filter(row => filters.every(filter => filter(row))).slice(0, limit); if (updates) data.forEach(row => Object.assign(row, updates)); return Promise.resolve({ data, error: null }).then(resolve) },
    }
    return q
  },
  async rpc(name, { candidate_id, outcome, metadata }) {
    const current = rows.find(row => row.id === candidate_id)
    if (name === "claim_employer_availability") return { data: [{ ...current, check_token: "test-lease" }], error: null }
    if (name === "finish_employer_availability") { Object.assign(current, metadata, { availability_state: outcome }); return { error: null } }
    assert.equal(name, "publish_employer_candidate"); const row = rows.find(row => row.id === candidate_id); row.status = "published"; published.push(candidate_id); return { data: candidate_id, error: null } },
}
const mocked = typescriptLoader({ "./parser": { readEmployerCandidate: async (_, job) => {
  if (job.id === "failed") throw new Error("Source unavailable")
  if (job.id === "closed") return null
  return { activeConfirmed: true, deadlineType: job.id === "missing" ? "not_specified" : "fixed", deadline: job.id === "missing" ? null : "2099-01-01", compensation: null, description: "Current source description", organization: "Volvo", location: "Sweden" }
} } })
const { processEmployerImportBatch } = mocked("lib/employer-import/service.ts")
const first = await processEmployerImportBatch(db, "master", null, true)
assert.equal(first.attempted, 4); assert.equal(first.published, 2); assert.equal(first.skipped.length, 2); assert.equal(first.nextCursor, "4"); assert.equal(first.hasMore, true)
assert.equal(rows[1].deadline, null, "A missing deadline must clear stale stored dates")
assert.equal(rows[2].availability_state, "closed", "A closed position cannot be published")
const second = await processEmployerImportBatch(db, "master", first.nextCursor, true)
assert.equal(second.published, 2); assert.equal(second.hasMore, false)
assert.deepEqual(published, ["1", "2", "5", "6"])
assert.equal(rows[0].compensation, null, "Unspecified pay must not be invented")
console.log("PASS multilingual deadlines, invalid dates, no invented dates/pay, refreshed metadata, closed jobs, partial failures, and publication-safe batch pagination")
