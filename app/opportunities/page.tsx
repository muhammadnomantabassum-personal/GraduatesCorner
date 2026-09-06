import Link from "next/link"
import { notFound } from "next/navigation"
import { PublicLayout } from "@/components/layout/public-layout"
import { CatalogueList } from "@/components/seo/catalogue-list"
import { getOpportunityCatalogue } from "@/lib/seo-catalogue"
import { SEO_LANDINGS } from "@/lib/seo-landings"
import { createPageMetadata } from "@/lib/seo"
function pageNumber(page?: string) {
  if (page !== undefined && (!/^[1-9]\d*$/.test(page) || !Number.isSafeInteger(Number(page)))) notFound()
  return page ? Number(page) : 1
}
export async function generateMetadata({searchParams}:{searchParams:Promise<{page?:string}>}) {
  const {page}=await searchParams
  const number=pageNumber(page)
  return createPageMetadata({title:`All academic and graduate opportunities${number>1?` – Page ${number}`:""}`,description:"Browse current PhD positions, master's thesis projects, internships and graduate trainee programs. Explore opportunities by country and research field.",path:`/opportunities${number>1?`?page=${number}`:""}`})
}
export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}) {
  const {page}=await searchParams
  const number=pageNumber(page)
  const items=await getOpportunityCatalogue()
  if (number > Math.max(1, Math.ceil(items.length / 24))) notFound()
  return <PublicLayout><div className="mx-auto max-w-6xl space-y-8 px-4 py-12"><h1 className="text-4xl font-bold">Academic and graduate opportunities</h1><p>Explore current roles by country, subject and opportunity type. Each listing links to its original source.</p><nav aria-label="Browse by country and field" className="flex flex-wrap gap-3">{SEO_LANDINGS.map(item=><Link key={item.slug} className="rounded border px-3 py-2 underline" href={`/opportunities/${item.slug}`}>{item.title}</Link>)}</nav><p>{items.length} current opportunities · Page {number}</p><CatalogueList items={items.slice((number-1)*24,number*24)} /><nav aria-label="Results pages" className="flex gap-6">{number>1&&<Link rel="prev" href={number===2?"/opportunities":`/opportunities?page=${number-1}`}>← Previous</Link>}{number*24<items.length&&<Link rel="next" href={`/opportunities?page=${number+1}`}>Next →</Link>}</nav></div></PublicLayout>
}
