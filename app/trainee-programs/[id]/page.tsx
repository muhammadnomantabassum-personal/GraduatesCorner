import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { OpportunityDetail } from "@/components/seo/opportunity-detail"
import { getSeoProgram, getRelatedOpportunities } from "@/lib/seo-data"
import { opportunityPath } from "@/lib/opportunity-url"
import { createPageMetadata } from "@/lib/seo"
export const revalidate = 300
export async function generateStaticParams() { return [] }
async function getRecord(id: string) { return getSeoProgram(id) }
export async function generateMetadata({params}: {params: Promise<{id:string}>}): Promise<Metadata> {
  const {id} = await params
  const record = await getRecord(id)
  if (!record) return createPageMetadata({title:"Opportunity not found",description:"This opportunity is not available.",path:"/trainee-programs",noIndex:true})
  const organization = record.company
  const label = "Graduate trainee program"
  return createPageMetadata({title:record.title + " | " + organization,description:label + " at " + organization + " in " + record.location + ". " + record.title + ". Deadline: " + record.deadline + ". " + record.description,path:opportunityPath("trainee",record.id,record.title,organization),noIndex:record.deadline < new Date().toISOString().slice(0,10)})
}
export default async function Page({params}: {params: Promise<{id:string}>}) {
  const {id} = await params
  const record = await getRecord(id)
  if (!record) notFound()
  const kind = "trainee"
  return <OpportunityDetail record={record} kind={kind} related={await getRelatedOpportunities(record.id,kind)} />
}
