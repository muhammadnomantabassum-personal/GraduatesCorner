"use client"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

export function ListingApply({ id, kind, href }: { id: string; kind: "thesis" | "program"; href: string }) {
  const { user } = useAuth()
  async function recordApplication() {
    if (user?.type !== "student") return
    await createClient().from("applications").insert({ user_id: user.id, [kind === "thesis" ? "thesis_id" : "program_id"]: id })
  }
  return <a href={href} target="_blank" rel="noopener noreferrer" onClick={recordApplication} className="inline-flex rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Apply on the official website ↗</a>
}
