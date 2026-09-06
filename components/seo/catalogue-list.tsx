import Link from "next/link"
import { htmlToPlainText } from "@/lib/text"
export function CatalogueList({items}: {items:Array<{id:string;path:string;title:string;organization:string;location:string;description:string;deadline:string}>}) {
  return <ul className="grid gap-5 md:grid-cols-2">{items.map(item=><li key={item.id} className="rounded-xl border p-5"><h2 className="mb-2 text-xl font-semibold"><Link href={item.path} className="hover:underline">{item.title}</Link></h2><p className="text-sm text-muted-foreground">{item.organization} · {item.location}</p><p className="my-3 leading-relaxed">{htmlToPlainText(item.description).slice(0,180)}…</p><p className="text-sm">Deadline: <time dateTime={item.deadline}>{item.deadline}</time></p></li>)}</ul>
}
