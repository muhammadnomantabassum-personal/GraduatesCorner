import Link from "next/link"
import { PublicLayout } from "@/components/layout/public-layout"
import { ListingApply } from "./listing-apply"
import { JsonLd } from "./json-ld"
import { buildBreadcrumbSchema, buildJobPostingSchema, buildThesisSchema } from "@/lib/seo"
import { opportunityPath } from "@/lib/opportunity-url"
import { sanitizeListingHtml } from "@/lib/sanitize-listing-html"
import { isHtmlContent } from "@/lib/text"
import type { SeoThesis, SeoProgram } from "@/lib/seo-data"

export function OpportunityDetail({ record, kind, related }: { record: SeoThesis | SeoProgram; kind: "master" | "phd" | "trainee"; related: Array<{id:string;title:string;organization:string}> }) {
  const organization = "organization" in record ? record.organization : record.company
  const field = "subject" in record ? record.subject : record.field
  const internship = "opportunity_kind" in record && record.opportunity_kind === "internship"
  const label = kind === "phd" ? "PhD position" : kind === "trainee" ? "Graduate trainee program" : internship ? "Internship" : "Master's thesis"
  const category = kind === "master" ? "/master-thesis" : kind === "phd" ? "/phd-positions" : "/trainee-programs"
  const path = opportunityPath(kind, record.id, record.title, organization)
  const active = record.deadline >= new Date().toISOString().slice(0, 10)
  const datePosted = record.source_published_at || record.created_at.slice(0,10)
  const official = /^https?:\/\//i.test(record.external_url || "") ? record.external_url! : null
  const input = { id: record.id, title: record.title, description: record.description, organization, location: record.location, deadline: record.deadline, createdAt: datePosted, field, path }
  const vacancy = kind !== "master" || internship || ("organization_type" in record && record.organization_type === "company")
  const job = active && official && vacancy ? buildJobPostingSchema({ ...input, kind: internship ? "internship" : kind }) : null
  const schema = [buildBreadcrumbSchema([{name:"Home",path:"/"},{name:label,path:category},{name:record.title,path}]), ...(job ? [job] : []), ...(!vacancy && active ? [buildThesisSchema({...input, path})] : [])]
  return <PublicLayout>
    <JsonLd data={schema} />
    <header className="bg-primary px-4 py-12 text-primary-foreground"><div className="mx-auto max-w-5xl">
      <Link href={category} className="text-sm underline">← Browse {label.toLowerCase()} opportunities</Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide">{label}</p>
      <h1 className="my-4 text-balance text-3xl font-bold lg:text-5xl">{record.title}</h1>
      <p className="text-lg">{organization} · {record.location}</p>
      <p className="mt-4 text-sm">Posted <time dateTime={datePosted}>{datePosted}</time> · Deadline: <time dateTime={record.deadline}>{record.deadline}</time></p>
    </div></header>
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1fr_280px]">
      <article className="min-w-0 space-y-8">
        {!active && <p role="status" className="rounded-lg border p-4 font-semibold">Applications closed. This listing is kept for reference. <Link href={category} className="underline">Browse current opportunities.</Link></p>}
        <section><h2 className="mb-4 text-2xl font-semibold">{kind === "trainee" ? "Program description" : "Project description"}</h2>
          {isHtmlContent(record.description) ? <div className="prose prose-sm max-w-none break-words dark:prose-invert" dangerouslySetInnerHTML={{__html:sanitizeListingHtml(record.description)}} /> : <p className="whitespace-pre-line leading-relaxed">{record.description}</p>}
        </section>
        <section><h2 className="mb-3 text-2xl font-semibold">Funding and compensation</h2><p>{record.compensation === "paid" ? "Paid position" : record.compensation === "stipend" ? "Stipend offered" : "Unpaid position"}. See the original posting for amounts, duration and conditions.</p></section>
        <section><h2 className="mb-3 text-2xl font-semibold">Eligibility and application requirements</h2><p>Review the qualifications, research interests and required documents in the description above. The employer or university&apos;s original posting is the source for complete eligibility requirements.</p></section>
        <section><h2 className="mb-3 text-2xl font-semibold">How to apply</h2><p className="mb-4">{active ? `Submit your application through ${organization}'s official application process before ${record.deadline}.` : "The advertised deadline has passed."}</p>
          {active && official ? <ListingApply id={record.id} kind={kind === "trainee" ? "program" : "thesis"} href={official} /> : !official ? <p>No official application link was supplied.</p> : null}
        </section>
        {official && <section><h2 className="mb-3 text-xl font-semibold">Source and listing information</h2><p>This opportunity is published by {organization}. <a href={official} target="_blank" rel="noopener noreferrer" className="underline">Read the original official posting.</a> Conditions and availability may change; confirm them with the organization.</p><Link href="/contact" className="mt-2 inline-block underline">Report an outdated or incorrect listing</Link></section>}
      </article>
      <aside className="h-fit rounded-xl border p-5"><h2 className="mb-4 text-xl font-semibold">Opportunity details</h2><dl className="space-y-4"><div><dt className="font-semibold">Organization</dt><dd>{organization}</dd></div><div><dt className="font-semibold">Field</dt><dd>{field}</dd></div><div><dt className="font-semibold">Location</dt><dd>{record.location}</dd></div>{"duration" in record && <div><dt className="font-semibold">Duration</dt><dd>{record.duration}</dd></div>}<div><dt className="font-semibold">Deadline</dt><dd><time dateTime={record.deadline}>{record.deadline}</time></dd></div></dl></aside>
    </div>
    <section className="mx-auto max-w-5xl px-4 pb-12"><h2 className="mb-5 text-2xl font-semibold">More opportunities</h2><ul className="grid gap-4 sm:grid-cols-3">{related.map(item=><li key={item.id} className="rounded-lg border p-4"><Link className="font-semibold underline" href={opportunityPath(kind,item.id,item.title,item.organization)}>{item.title}</Link><p className="mt-2 text-sm">{item.organization}</p></li>)}</ul><Link href={category} className="mt-5 inline-block underline">Browse all {label.toLowerCase()} opportunities</Link></section>
  </PublicLayout>
}
