"use client"
import type { Thesis } from "@/lib/data/types"
import { opportunityPath } from "@/lib/opportunity-url"
import { getWorkMode } from "@/lib/opportunity-filters"
import { OpportunityCard } from "./opportunity-card"
export function ThesisCard({ thesis }: { thesis: Thesis }) {
  return <OpportunityCard description={thesis.description} sourceLabel={thesis.postedBy === "admin" ? "Listed by our team" : thesis.organizationVerified ? "Verified publisher" : undefined} item={{id:thesis.id,kind:"thesis",typeLabel:thesis.type === "phd" ? "PhD position" : thesis.opportunityKind === "internship" ? "Internship" : "Master’s thesis",title:thesis.title,organization:thesis.organization,field:thesis.subject,location:thesis.location,compensation:thesis.compensation,deadline:thesis.deadline,workMode:getWorkMode(thesis.location),verified:Boolean(thesis.organizationVerified),signalScore:0,href:opportunityPath(thesis.type,thesis.id,thesis.title,thesis.organization)}} />
}
