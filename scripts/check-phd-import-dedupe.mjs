import assert from "node:assert/strict"
import {
  findExistingPhdMatch,
  normalizeOpportunityUrl,
} from "../lib/phd-import/dedupe.ts"

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

console.log("PhD import deduplication checks passed.")
