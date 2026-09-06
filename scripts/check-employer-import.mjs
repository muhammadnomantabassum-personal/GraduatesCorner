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
assert.equal(isoDeadline("Tue Nov 03 23:00:00 UTC 2026"), "2026-11-03")
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
  const searches = []
  const mockLoad = typescriptLoader({
    "node:dns/promises": { lookup: async () => [{ address: "8.8.8.8", family: 4 }] },
    fetch: async (url, options) => {
      const value = String(url); calls.push(value)
      if (value.endsWith("/robots.txt")) return new Response("User-agent: *\nAllow: /", { status: 200 })
      if (value.endsWith("/jobs")) {
        assert.equal(options.method, "POST")
        searches.push(JSON.parse(options.body).searchText)
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
  const traineeResult = await scanEmployerPage(source, { query: 0, offset: 0 }, new Set(["fixture:JR1", "fixture:JR2"]), "trainee")
  assert.equal(searches.at(-1), "trainee", "Trainee dashboard must start with trainee search terms")
  assert.equal(traineeResult.cursor.query, 3)
  const graduateResult = await scanEmployerPage(source, traineeResult.cursor, new Set(["fixture:JR1", "fixture:JR2"]), "trainee")
  assert.equal(graduateResult.cursor.query, 2, "Trainee scans must continue their own search cycle")
  const sfSource = { id: "sf", name: "Fixture", country: "Sweden", publicUrl: "https://fixture.example/search/", adapter: "successfactors", verified: true, allowedHosts: ["fixture.example"] }
  const sfLoad = typescriptLoader({
    "node:dns/promises": { lookup: async () => [{ address: "8.8.8.8", family: 4 }] },
    fetch: async url => new Response(String(url).endsWith("robots.txt") ? "User-agent: *\nAllow: /" : Array.from({ length: 25 }, (_, i) => `<a class="jobTitle-link" href="/job/${i}">Master Thesis ${i}</a>`.repeat(2)).join("")),
  })
  const sfResult = await sfLoad("lib/employer-import/parser.ts").scanEmployerPage(sfSource, { query: 0, offset: 0 }, new Set(Array.from({ length: 25 }, (_, i) => `https://fixture.example/job/${i}`)))
  assert.equal(sfResult.duplicates, 25)
  assert.equal(sfResult.cursor.offset, 25, "Responsive duplicate links must not skip a results page")
  let broken = false
  const detailLoad = typescriptLoader({
    "node:dns/promises": { lookup: async () => [{ address: "8.8.8.8", family: 4 }] },
    fetch: async url => new Response(String(url).endsWith("robots.txt") ? "User-agent: *\nAllow: /" : String(url).includes("/search/") ? '<a class="jobTitle-link" href="/job/1">Master Thesis Energy</a>' : broken ? '<main>Unavailable</main>' : '<meta itemprop="streetAddress" content="Sodertalje, SE"><meta itemprop="validThrough" content="Tue Nov 03 23:00:00 UTC 2028"><span itemprop="description">A master thesis project in sustainable engineering. Collaborate with researchers and industry specialists to build new energy systems and validate practical results.</span>'),
  })
  const detailScan = detailLoad("lib/employer-import/parser.ts").scanEmployerPage
  const detailResult = await detailScan(sfSource, { query: 0, offset: 0 }, new Set())
  assert.equal(detailResult.candidates[0].location, "Sodertalje, SE")
  assert.equal(detailResult.candidates[0].deadline, "2028-11-03")
  broken = true
  const retry = await detailScan(sfSource, { query: 0, offset: 0 }, new Set())
  assert.equal(retry.cursor.retry, 1)
  const advance = await detailScan(sfSource, { query: 0, offset: 0, retry: 2 }, new Set())
  assert.equal(advance.cursor.query, 1, "A permanently broken detail must not trap later pages")
  console.log("PASS employer catalogue, multilingual classification, canonical duplicates, missing metadata, robots rules, ATS parsing, incremental cursor, and skip-before-fetch")
}
