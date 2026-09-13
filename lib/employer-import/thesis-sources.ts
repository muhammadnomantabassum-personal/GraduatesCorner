import type { EmployerSource } from "./catalogue"

// Public endpoints checked with the actual importer on 2026-09-13.
// Empty feeds are valid: future scans pick up newly advertised student roles.
export const VERIFIED_THESIS_SOURCES: EmployerSource[] = [
  {
    "id": "alstom-sweden",
    "name": "Alstom Sweden",
    "country": "Sweden",
    "publicUrl": "https://www.alstom.com/careers",
    "adapter": "successfactors",
    "allowedHosts": [
      "www.alstom.com",
      "jobsearch.alstom.com"
    ],
    "listingUrl": "https://jobsearch.alstom.com/search/",
    "verified": true
  },
  {
    "id": "combitech",
    "name": "Combitech",
    "country": "Sweden",
    "publicUrl": "https://www.combitech.com/",
    "adapter": "workday",
    "allowedHosts": [
      "www.combitech.com",
      "saabgroup.wd116.myworkdayjobs.com"
    ],
    "tenant": "saabgroup",
    "board": "Combitech_careers",
    "listingUrl": "https://saabgroup.wd116.myworkdayjobs.com/Combitech_careers",
    "verified": true
  },
  {
    "id": "aalto",
    "name": "Aalto University",
    "country": "Finland",
    "publicUrl": "https://www.aalto.fi/en/corporate-collaboration/commission-a-masters-thesis",
    "adapter": "workday",
    "allowedHosts": [
      "www.aalto.fi",
      "aalto.wd3.myworkdayjobs.com"
    ],
    "tenant": "aalto",
    "board": "aalto",
    "listingUrl": "https://aalto.wd3.myworkdayjobs.com/aalto",
    "verified": true
  },
  {
    "id": "outokumpu",
    "name": "Outokumpu",
    "country": "Finland",
    "publicUrl": "https://www.outokumpu.com/en/careers",
    "adapter": "successfactors",
    "allowedHosts": [
      "www.outokumpu.com",
      "careers.outokumpu.com"
    ],
    "listingUrl": "https://careers.outokumpu.com/search/",
    "verified": true
  },
  {
    "id": "huhtamaki",
    "name": "Huhtamaki",
    "country": "Finland",
    "publicUrl": "https://www.huhtamaki.com/en/careers/",
    "adapter": "workday",
    "allowedHosts": [
      "www.huhtamaki.com",
      "huhtamaki.wd103.myworkdayjobs.com"
    ],
    "tenant": "huhtamaki",
    "board": "External",
    "listingUrl": "https://huhtamaki.wd103.myworkdayjobs.com/External",
    "verified": true
  },
  {
    "id": "vaisala",
    "name": "Vaisala",
    "country": "Finland",
    "publicUrl": "https://www.vaisala.com/en/careers",
    "adapter": "successfactors",
    "allowedHosts": [
      "www.vaisala.com",
      "careers.vaisala.com"
    ],
    "listingUrl": "https://careers.vaisala.com/search/",
    "verified": true
  },
  {
    "id": "wilhelmsen",
    "name": "Wilhelmsen",
    "country": "Norway",
    "publicUrl": "https://www.wilhelmsen.com/careers/",
    "adapter": "workday",
    "allowedHosts": [
      "www.wilhelmsen.com",
      "wilhelmsen.wd3.myworkdayjobs.com"
    ],
    "tenant": "wilhelmsen",
    "board": "Wilhelmsen",
    "listingUrl": "https://wilhelmsen.wd3.myworkdayjobs.com/Wilhelmsen",
    "verified": true
  },
  {
    "id": "carlsberg",
    "name": "Carlsberg Group",
    "country": "Denmark",
    "publicUrl": "https://careers.carlsberg.com/",
    "adapter": "successfactors",
    "allowedHosts": [
      "careers.carlsberg.com",
      "careers.carlsberg.com"
    ],
    "listingUrl": "https://careers.carlsberg.com/search/",
    "verified": true
  },
  {
    "id": "iss",
    "name": "ISS World",
    "country": "Denmark",
    "publicUrl": "https://www.issworld.com/careers/your-career-at-iss",
    "adapter": "successfactors",
    "allowedHosts": [
      "www.issworld.com",
      "jobs.issworld.com"
    ],
    "listingUrl": "https://jobs.issworld.com/search/",
    "verified": true
  },
  {
    "id": "rockwool",
    "name": "Rockwool",
    "country": "Denmark",
    "publicUrl": "https://www.rockwool.com/group/about-us/careers/",
    "adapter": "workday",
    "allowedHosts": [
      "www.rockwool.com",
      "rockwoolgroup.wd3.myworkdayjobs.com"
    ],
    "tenant": "rockwoolgroup",
    "board": "ROCKWOOL",
    "listingUrl": "https://rockwoolgroup.wd3.myworkdayjobs.com/ROCKWOOL",
    "verified": true
  },
  {
    "id": "flsmidth",
    "name": "FLSmidth",
    "country": "Denmark",
    "publicUrl": "https://fls.com/en/en-gb/careers",
    "adapter": "workday",
    "allowedHosts": [
      "fls.com",
      "flsmidth.wd3.myworkdayjobs.com"
    ],
    "tenant": "flsmidth",
    "board": "FLS_Global",
    "listingUrl": "https://flsmidth.wd3.myworkdayjobs.com/FLS_Global",
    "verified": true
  },
  {
    "id": "gn",
    "name": "GN Group",
    "country": "Denmark",
    "publicUrl": "https://gn.wd3.myworkdayjobs.com/GN-Careers",
    "adapter": "workday",
    "allowedHosts": [
      "gn.wd3.myworkdayjobs.com",
      "gn.wd3.myworkdayjobs.com"
    ],
    "tenant": "gn",
    "board": "GN-Careers",
    "listingUrl": "https://gn.wd3.myworkdayjobs.com/GN-Careers",
    "verified": true
  },
  {
    "id": "fugro",
    "name": "Fugro",
    "country": "Netherlands",
    "publicUrl": "https://www.fugro.com/careers",
    "adapter": "workday",
    "allowedHosts": [
      "www.fugro.com",
      "fugro.wd3.myworkdayjobs.com"
    ],
    "tenant": "fugro",
    "board": "Careers",
    "listingUrl": "https://fugro.wd3.myworkdayjobs.com/Careers",
    "verified": true
  },
  {
    "id": "damen",
    "name": "Damen Shipyards",
    "country": "Netherlands",
    "publicUrl": "https://career.damen.com/",
    "adapter": "workday",
    "allowedHosts": [
      "career.damen.com",
      "damen.wd3.myworkdayjobs.com"
    ],
    "tenant": "damen",
    "board": "Damen_Careers",
    "listingUrl": "https://damen.wd3.myworkdayjobs.com/Damen_Careers",
    "verified": true
  },
  {
    "id": "volkswagen",
    "name": "Volkswagen Group",
    "country": "Germany",
    "publicUrl": "https://www.volkswagen-karriere.de/en/entry-opportunities/students.html",
    "adapter": "successfactors",
    "allowedHosts": [
      "www.volkswagen-karriere.de",
      "jobs.volkswagen-group.com"
    ],
    "listingUrl": "https://jobs.volkswagen-group.com/search/",
    "verified": true
  },
  {
    "id": "signify",
    "name": "Signify",
    "country": "Netherlands",
    "publicUrl": "https://www.careers.signify.com/global/en",
    "adapter": "workday",
    "allowedHosts": [
      "www.careers.signify.com",
      "lighting.wd3.myworkdayjobs.com"
    ],
    "tenant": "lighting",
    "board": "jobs-and-careers",
    "listingUrl": "https://lighting.wd3.myworkdayjobs.com/jobs-and-careers",
    "verified": true
  },
  {
    "id": "studentjob-nl",
    "name": "Studentjob.nl / StudentenWerk",
    "country": "Netherlands",
    "publicUrl": "https://www.studentjob.nl/",
    "adapter": "html",
    "allowedHosts": [
      "www.studentjob.nl"
    ],
    "listingUrl": "https://www.studentjob.nl/",
    "verified": true
  },
  {
    "id": "deloitte-nl",
    "name": "Deloitte Netherlands",
    "country": "Netherlands",
    "publicUrl": "https://werkenbijdeloitte.nl/studenten/",
    "adapter": "html",
    "allowedHosts": [
      "werkenbijdeloitte.nl"
    ],
    "listingUrl": "https://werkenbijdeloitte.nl/studenten/",
    "verified": true
  },
  {
    "id": "nedap",
    "name": "Nedap",
    "country": "Netherlands",
    "listingUrl": "https://www.nedap.com/en/careers",
    "publicUrl": "https://www.nedap.com/en/careers",
    "adapter": "html",
    "allowedHosts": [
      "www.nedap.com"
    ],
    "verified": true
  }
]
