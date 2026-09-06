import assert from "node:assert/strict"
import { writeFileSync } from "node:fs"
import { typescriptLoader } from "./employer-test-loader.mjs"

const load = typescriptLoader()
const { canonicalJobUrl, classifyEmployerTitle, isoDeadline } = load("lib/employer-import/identity.ts")
const { robotsAllows } = load("lib/employer-import/fetch.ts")
const { EMPLOYER_SOURCES } = load("lib/employer-import/catalogue.ts")
assert.equal(new Set(EMPLOYER_SOURCES.map(source => source.id)).size, EMPLOYER_SOURCES.length)
assert.ok(EMPLOYER_SOURCES.length >= 95)
assert.equal(canonicalJobUrl("https://jobs.example.com/job/42/?utm_source=x&jobId=42#apply"), "https://jobs.example.com/job/42?jobId=42")
assert.equal(canonicalJobUrl("https://abb.wd3.myworkdayjobs.com/en-US/Board/job/City/Title_JR1/apply?source=careers"), "https://abb.wd3.myworkdayjobs.com/Board/job/City/Title_JR1")
assert.equal(canonicalJobUrl("https://www.smartrecruiters.com/BoschGroup/123-thesis-title"), "https://jobs.smartrecruiters.com/BoschGroup/123")
assert.throws(() => canonicalJobUrl("http://localhost/job/1"))
for (const [title, kind] of [["Master Thesis AI", "master_thesis"], ["Masteroppgave energi", "master_thesis"], ["Examensarbete inom automation", "master_thesis"], ["Praktikum Engineering", "internship"], ["Summer internship", "internship"], ["Master's non-thesis internship", "internship"], ["Finance Graduate Programme 2027", "trainee"], ["Management Trainee", "trainee"], ["Senior Software Engineer", null], ["PhD Thesis in AI", null], ["Bachelor thesis in finance", null]]) assert.equal(classifyEmployerTitle(title), kind, title)
assert.equal(isoDeadline("2028-02-29T12:00:00Z"), "2028-02-29")
assert.equal(isoDeadline("2027-02-29"), null)
assert.equal(isoDeadline("Rolling applications"), null)
assert.equal(robotsAllows("User-agent: *\nDisallow: /api/\nAllow: /api/jobs", "/api/jobs?page=1"), true)
assert.equal(robotsAllows("User-agent: *\nDisallow: /api/", "/api/private"), false)
assert.equal(robotsAllows("User-agent: *\nDisallow: /*.json$", "/jobs.json"), false)
assert.equal(robotsAllows("User-agent: *\nDisallow: /\nUser-agent: GraduatesCorner\nAllow: /jobs", "/jobs"), true)
assert.equal(robotsAllows("User-agent: GraduatesCorner\nDisallow:\nUser-agent: *\nDisallow: /", "/jobs"), true)

const requested = process.argv.find(arg => arg.startsWith("--live="))?.slice(7).split(",")
if (requested) {
  const { scanEmployerPage } = load("lib/employer-import/parser.ts")
  for (const id of requested) {
    const source = EMPLOYER_SOURCES.find(source => source.id === id)
    assert.ok(source, id)
    try {
      const result = await scanEmployerPage(source, { query: 0, offset: 0 }, new Set())
      writeFileSync(`.tmp-employer-probes/${id}-candidates.json`, JSON.stringify(result, null, 2))
      console.log(JSON.stringify({ source: id, candidates: result.candidates.length, found: result.found, excluded: result.excluded, errors: result.errors, cursor: result.cursor }))
    } catch (error) { console.log(JSON.stringify({ source: id, error: error.message })) }
  }
} else {
  const calls = []
  const mockLoad = typescriptLoader({
    "node:dns/promises": { lookup: async () => [{ address: "8.8.8.8", family: 4 }] },
    fetch: async (url, options) => {
      const value = String(url); calls.push(value)
      if (value.endsWith("/robots.txt")) return new Response("User-agent: *\nAllow: /", { status: 200 })
      if (value.endsWith("/jobs")) {
        assert.equal(options.method, "POST")
        return Response.json({ total: 3, jobPostings: [
          { title: "Master Thesis Control", externalPath: "/job/City/Thesis_JR1", bulletFields: ["JR1"], locationsText: "Sweden" },
          { title: "Master Thesis Energy", externalPath: "/job/City/Thesis_JR2", bulletFields: ["JR2"], locationsText: "Sweden" },
          { title: "Senior Director", externalPath: "/job/City/Director_JR3", bulletFields: ["JR3"] },
        ] })
      }
      if (value.includes("JR2")) return Response.json({ jobPostingInfo: { jobDescription: "<p>Master Thesis opportunity in engineering and sustainable energy. You will work with a multidisciplinary research team on a practical technical project in Sweden.</p>", location: "Stockholm", country: { descriptor: "Sweden" } } })
      throw new Error(`Unexpected detail request: ${value}`)
    },
  })
  const { scanEmployerPage } = mockLoad("lib/employer-import/parser.ts")
  const source = { id: "fixture", name: "Fixture employer", country: "Sweden", publicUrl: "https://fixture.myworkdayjobs.com/Board", listingUrl: "https://fixture.myworkdayjobs.com/Board", adapter: "workday", tenant: "fixture", board: "Board", allowedHosts: ["fixture.myworkdayjobs.com"] }
  const result = await scanEmployerPage(source, { query: 0, offset: 0 }, new Set(["fixture:JR1"]))
  assert.equal(result.duplicates, 1)
  assert.equal(result.excluded, 1)
  assert.equal(result.candidates.length, 1)
  assert.equal(result.candidates[0].deadline, null, "Do not invent a deadline")
  assert.equal(result.candidates[0].compensation, null, "Do not invent compensation")
  assert.equal(result.cursor.query, 1)
  assert.ok(!calls.some(url => url.includes("JR1")), "Known jobs must skip detail requests")
  console.log("PASS employer catalogue, multilingual classification, canonical duplicates, missing metadata, robots rules, ATS parsing, incremental cursor, and skip-before-fetch")
}
