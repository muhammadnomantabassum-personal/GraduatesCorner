"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { discoveryTracks } from "@/lib/discovery"
export function OpportunityTypeLinks({kind,onKindChange}:{kind?:string;onKindChange?:(kind:string)=>void}) {
  const pathname=usePathname()
  return <nav aria-label="Opportunity types" className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-5">{discoveryTracks.map(item=>{
    const selected=item.key === "internship" ? pathname==="/master-thesis"&&kind==="internship" : item.key === "master" ? pathname==="/master-thesis"&&kind!=="internship" : pathname===item.href
    return <Link key={item.key} href={item.href} aria-current={selected?"page":undefined} onClick={event=>{if(onKindChange&&(item.key==="master"||item.key==="internship")){event.preventDefault();onKindChange(item.key==="internship"?"internship":"master_thesis")}}} className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${selected?"border-primary bg-primary text-primary-foreground shadow-sm":"border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"}`}>{item.label}</Link>
  })}</nav>
}
