import { deadlineLabel, isDeadlineOpen } from "@/lib/opportunity-deadline"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { OpportunityDetail } from "@/components/seo/opportunity-detail"
import { getSeoThesis, getRelatedOpportunities } from "@/lib/seo-data"
import { opportunityPath } from "@/lib/opportunity-url"
import { createPageMetadata } from "@/lib/seo"
export const revalidate = 300
export async function generateStaticParams() { return [] }
async function getRecord(id: string) { return getSeoThesis(id) }
export async function generateMetadata({params}: {params: Promise<{id:string}>}): Promise<Metadata> {
  const {id} = await params
  const record = await getRecord(id)
  if (!record) return createPageMetadata({title:"Opportunity not found",description:"This opportunity is not available.",path:"/theses",noIndex:true})
  const organization = record.organization
  const label = record.opportunity_kind === "internship" ? "Internship" : "Master's thesis"
  return createPageMetadata({title:record.title + " | " + organization,description:label + " at " + organization + " in " + record.location + ". " + record.title + ". Deadline: " + deadlineLabel(record.deadline, record.deadline_type) + ". " + record.description,path:opportunityPath(record.type,record.id,record.title,organization),noIndex:!isDeadlineOpen(record.deadline)})
}
export default async function Page({params}: {params: Promise<{id:string}>}) {
  const {id} = await params
  const record = await getRecord(id)
  if (!record) notFound()
  const kind = record.type
  return <OpportunityDetail record={record} kind={kind} related={await getRelatedOpportunities(record.id,kind)} />
}
