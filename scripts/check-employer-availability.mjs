import assert from "node:assert/strict"
import { typescriptLoader } from "./employer-test-loader.mjs"
const load = typescriptLoader()
const { readEmployerCandidate } = load("lib/employer-import/parser.ts")
const { inferDeadlineType, deadlineLabel } = load("lib/opportunity-deadline.ts")
const { getDeadlineBucket, matchesDeadline } = load("lib/opportunity-filters.ts")
const { sortOpportunityResults } = load("lib/opportunity-sort.ts")
const source = { id: "fixture", name: "Fixture", country: "Sweden", publicUrl: "https://fixture.example", adapter: "html", allowedHosts: ["fixture.example"] }
const job = { id: "123", title: "Master Thesis Engineering", url: "https://fixture.example/jobs/123" }
const description = "A master thesis project in engineering. Work with researchers to explore energy systems, compare experimental results and develop sustainable solutions."
async function readPage(body, finalUrl = job.url) {
  return readEmployerCandidate(source, job, async () => ({ text: body, finalUrl }))
}
const structured = (extra = {}) => `<script type="application/ld+json">${JSON.stringify({ "@type": "JobPosting", title: job.title, url: job.url, description, ...extra })}</script>`
const noDate = await readPage(structured())
assert.equal(noDate.deadline, null)
assert.equal(noDate.deadlineType, "not_specified")
assert.equal(noDate.activeConfirmed, true)
const rolling = await readPage(structured({ description: description + " Applications are reviewed continuously." }))
assert.equal(rolling.deadlineType, "rolling")
assert.equal(rolling.deadline, null)
assert.equal(inferDeadlineType(null, "Applications accepted until filled."), "until_filled")
assert.equal(inferDeadlineType(null, "Work continuously with rolling stock."), "not_specified")
assert.equal(inferDeadlineType("2099-01-01", "Applications are reviewed continuously."), "fixed")
assert.equal((await readPage(`<main><h1>${job.title}</h1>${description}<a href="/apply/123">Apply now</a></main>`)).activeConfirmed, true)
assert.equal((await readPage(`<main><h1>Careers</h1>${description}<a href="/apply/123">Apply now</a></main>`)).activeConfirmed, false)
assert.equal((await readPage(`<main><h1>${job.title}</h1>${description}<button disabled>Apply now</button></main>`)).activeConfirmed, false)
assert.equal((await readPage(structured(), "https://fixture.example/careers")).activeConfirmed, false, "Redirected career pages must not prove activity")
assert.equal(await readPage(structured() + "<main>Applications are closed.</main>"), null)
assert.equal(await readPage(structured({ validThrough: "2000-01-01" })), null)
assert.equal((await readPage(structured({ validThrough: "2099-01-01" }))).deadline, "2099-01-01")
assert.equal(deadlineLabel(null), "Deadline not specified — apply early")
assert.equal(deadlineLabel(null, "rolling"), "Applications reviewed continuously")
assert.equal(getDeadlineBucket(null), "no_deadline")
assert.equal(matchesDeadline(null, ["later"]), false)
assert.equal(matchesDeadline(null, ["no_deadline"]), true)
const sorted = sortOpportunityResults([{ deadline: null, createdAt: "2026-01-01", compensation: "paid" }, { deadline: "2099-01-01", createdAt: "2026-01-01", compensation: "paid" }], "deadline")
assert.equal(sorted[0].deadline, "2099-01-01")
console.log("PASS active source evidence, no invented deadlines, explicit rolling, closures, redirects, disabled applications, deadline labels, filtering and sorting")
