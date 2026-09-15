import "server-only"
import { getSeoIndexRecords } from "./seo-data"
import { opportunityPath } from "./opportunity-url"
import { seoCountry } from "./seo-location"
import type { SeoLanding } from "./seo-landings"
export async function getOpportunityCatalogue() {
  const {theses,programs}=await getSeoIndexRecords()
  return [...theses.map(item=>({...item,kind:item.type,organization:item.organization,field:item.subject})),...programs.map(item=>({...item,kind:"trainee",organization:item.company,field:item.field}))]
    .map(item=>({...item,path:opportunityPath(item.kind,item.id,item.title,item.organization)}))
    .sort((a,b)=>(a.deadline || "9999").localeCompare(b.deadline || "9999")||a.id.localeCompare(b.id))
}
export function matchesLanding(item: Awaited<ReturnType<typeof getOpportunityCatalogue>>[number], landing: SeoLanding) {
  if(item.kind!==landing.kind) return false
  if("country" in landing){const country=seoCountry(item.location)?.name;if(landing.country==="Europe") { if(!country||["United States","Canada","Australia","New Zealand","Japan","China","Singapore","India","South Korea","Brazil","South Africa"].includes(country))return false } else if(country!==landing.country)return false}
  if("funded" in landing && !["paid","stipend"].includes(item.compensation))return false
  if("internship" in landing && item.opportunity_kind!=="internship")return false
  if("funded" in landing && item.opportunity_kind==="internship")return false
  if("field" in landing && !new RegExp(landing.field,"i").test(item.title+" "+item.field))return false
  return true
}
