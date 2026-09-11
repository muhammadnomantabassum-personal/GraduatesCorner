"use client"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useWishlist } from "@/lib/wishlist-context"
import { Bookmark, ArrowUpRight } from "lucide-react"

export function ListingApply({ id, kind, href }: { id: string; kind: "thesis" | "program"; href: string }) {
  const { user } = useAuth()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const saved = isInWishlist(id, kind)
  async function recordApplication() {
    if (user?.type !== "student") return
    await createClient().from("applications").insert({ user_id: user.id, [kind === "thesis" ? "thesis_id" : "program_id"]: id })
  }
  return <><div className="flex flex-wrap gap-3"><a href={href} target="_blank" rel="noopener noreferrer" onClick={recordApplication} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Apply on the official website <ArrowUpRight className="size-4" /></a><button onClick={() => toggleWishlist(id, kind)} aria-pressed={saved} className="inline-flex min-h-12 items-center gap-2 rounded-xl border px-4 text-sm font-semibold"><Bookmark className={`size-4 ${saved ? "fill-current text-primary" : ""}`} />{saved ? "Saved" : "Save for later"}</button></div><div className="h-20 md:hidden" aria-hidden="true" /><div className="listing-mobile-actions fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t bg-card/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"><button aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} aria-pressed={saved} className="discovery-icon-button border px-3 text-primary" onClick={() => toggleWishlist(id, kind)}><Bookmark className={`size-5 ${saved ? "fill-current" : ""}`} /></button><a href={href} target="_blank" rel="noopener noreferrer" onClick={recordApplication} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground">Apply on official website <ArrowUpRight className="size-4" /></a></div></>
}
