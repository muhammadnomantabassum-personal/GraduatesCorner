import assert from "node:assert/strict"
import {
  extractOpportunityId,
  findExistingPhdMatch,
  normalizeOpportunityUrl,
} from "../lib/phd-import/dedupe.ts"
import {
  inferResearchFields,
  resolveCoveredOrganization,
} from "../lib/phd-import/classify.ts"
import {
  getPhdImportSource,
  PHD_IMPORT_SOURCES,
} from "../lib/phd-import/sources.ts"

const manualLinkopingPost = {
  id: "manual-linkoping",
  title: "PhD student in AI security",
  organization: "Linkoping University",
  deadline: "2026-07-31",
  external_url: "https://liu.se/en/work-at-liu/vacancies/29341 ",
  external_id: null,
  status: "approved",
}

const redirectedCandidate = {
  title: "PhD student in AI security",
  organization: "Linköping University",
  deadline: "2026-12-23",
  externalUrl:
    "https://web103.reachmee.com/ext/I011/853/job?site=7&lang=UK&job_id=29341",
  externalId: "29341",
}

assert.equal(
  findExistingPhdMatch(redirectedCandidate, [manualLinkopingPost])?.reason,
  "external_id",
  "redirected Linkoping URLs should match the same official vacancy ID"
)

assert.equal(
  findExistingPhdMatch(
    { ...redirectedCandidate, externalId: "29317", externalUrl: "https://liu.se/en/work-at-liu/vacancies/29317" },
    [manualLinkopingPost]
  ),
  null,
  "recurring titles with different official vacancy IDs must stay separate"
)

assert.equal(
  findExistingPhdMatch(
    {
      title: "Doctoral student in sustainable energy systems",
      organization: "Lund University",
      deadline: "2026-09-01",
      externalUrl: "https://example.edu/jobs/sustainable-energy",
      externalId: "url-fingerprint-a",
    },
    [{
      id: "legacy-lund",
      title: "Doctoral student in sustainable energy systems",
      organization: "Lund University",
      deadline: "2026-09-01",
      external_url: null,
      external_id: null,
      status: "approved",
    }]
  )?.reason,
  "title_organization_deadline",
  "legacy posts without official IDs should use the strict fallback"
)

assert.equal(
  normalizeOpportunityUrl("https://liu.se/en/work-at-liu/vacancies/29341/#details"),
  "https://liu.se/en/work-at-liu/vacancies/29341",
  "canonical URLs should ignore fragments and trailing slashes"
)

assert.equal(
  extractOpportunityId("https://www.jobbnorge.no/ledige-stillinger/stilling/305607/example"),
  "305607",
  "Jobbnorge path IDs should remain stable across title slug changes"
)

assert.equal(
  extractOpportunityId("https://www.academictransfer.com/en/jobs/362932/phd-position/"),
  "362932",
  "AcademicTransfer path IDs should be used for deduplication"
)

assert.equal(
  extractOpportunityId("https://ats.talentadore.com/apply/doctoral-researcher/mEo931"),
  "meo931",
  "TalentAdore job tokens should be used for deduplication"
)

const classifiedFields = inferResearchFields(
  "Doctoral researcher in machine learning for soft robotics and medical imaging",
  "The project combines artificial intelligence, robotics, neuroscience, statistics, and materials science."
)
assert.ok(classifiedFields.includes("Artificial Intelligence"))
assert.ok(classifiedFields.includes("Robotics and Automation"))
assert.ok(classifiedFields.length <= 5, "research field classification must never exceed five values")

const norwaySource = getPhdImportSource("norwegian-universities-jobbnorge")
assert.ok(norwaySource, "the Norwegian university network source should be registered")
assert.equal(
  resolveCoveredOrganization(norwaySource, [
    "NTNU - Norges teknisk-naturvitenskapelige universitet",
  ])?.name,
  "NTNU",
  "network imports should resolve the canonical university name"
)

assert.equal(PHD_IMPORT_SOURCES.length, 28, "all 17 Swedish and 11 new sources should be registered")
assert.equal(
  new Set(PHD_IMPORT_SOURCES.map((source) => source.id)).size,
  PHD_IMPORT_SOURCES.length,
  "source IDs must be unique"
)
assert.equal(
  PHD_IMPORT_SOURCES.filter((source) => source.country === "Finland").length,
  9,
  "all requested Finnish universities should be configured"
)

console.log("PhD import deduplication, source registry, and classification checks passed.")
