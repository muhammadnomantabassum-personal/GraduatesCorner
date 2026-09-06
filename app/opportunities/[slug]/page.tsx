import Link from "next/link"
import { notFound } from "next/navigation"
import { PublicLayout } from "@/components/layout/public-layout"
import { CatalogueList } from "@/components/seo/catalogue-list"
import { SEO_LANDINGS } from "@/lib/seo-landings"
import { getOpportunityCatalogue, matchesLanding } from "@/lib/seo-catalogue"
import { createPageMetadata } from "@/lib/seo"
export const revalidate=300
export async function generateStaticParams(){return SEO_LANDINGS.map(item=>({slug:item.slug}))}
async function load(slug:string){const landing=SEO_LANDINGS.find(item=>item.slug===slug);if(!landing)notFound();return {landing,items:(await getOpportunityCatalogue()).filter(item=>matchesLanding(item,landing))}}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {landing,items}=await load((await params).slug);return createPageMetadata({title:landing.title,description:landing.intro,path:`/opportunities/${landing.slug}`,noIndex:!items.length})}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {landing,items}=await load((await params).slug);return <PublicLayout><div className="mx-auto max-w-6xl space-y-8 px-4 py-12"><Link href="/opportunities" className="underline">← All opportunities</Link><h1 className="text-4xl font-bold">{landing.title}</h1><p className="max-w-3xl text-lg leading-relaxed">{landing.intro}</p><section className="max-w-3xl rounded-xl bg-muted p-6"><h2 className="mb-3 text-xl font-semibold">Before you apply</h2><p>{landing.advice}</p></section><p>{items.length} current matching opportunities</p>{items.length?<CatalogueList items={items.slice(0,48)}/>:<p>No current listings match this collection. <Link className="underline" href="/opportunities">Browse all open opportunities</Link> or check again as new roles are published.</p>}{items.length>48&&<Link className="underline" href="/opportunities">Browse the complete paginated directory</Link>}<nav aria-label="Related collections" className="flex flex-wrap gap-4">{SEO_LANDINGS.filter(item=>item.slug!==landing.slug&&item.kind===landing.kind).map(item=><Link className="underline" key={item.slug} href={`/opportunities/${item.slug}`}>{item.title}</Link>)}</nav></div></PublicLayout>}
