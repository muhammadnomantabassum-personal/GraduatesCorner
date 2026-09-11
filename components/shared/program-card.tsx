"use client"
import type { TraineeProgram } from "@/lib/data/types"
import { opportunityPath } from "@/lib/opportunity-url"
import { getWorkMode } from "@/lib/opportunity-filters"
import { OpportunityCard } from "./opportunity-card"
export function ProgramCard({ program }: { program: TraineeProgram }) {
  return <OpportunityCard description={program.description} sourceLabel={program.postedBy === "admin" ? "Listed by our team" : program.organizationVerified ? "Verified publisher" : undefined} item={{id:program.id,kind:"program",typeLabel:"Graduate program",title:program.title,organization:program.company,field:program.field,location:program.location,compensation:program.compensation,deadline:program.deadline,duration:program.duration,workMode:getWorkMode(program.location),verified:Boolean(program.organizationVerified),signalScore:0,href:opportunityPath("trainee",program.id,program.title,program.company)}} />
}
