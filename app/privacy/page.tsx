"use client"

import Link from "next/link"
import { useState } from "react"
import { PublicLayout } from "@/components/layout/public-layout"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { useComparison } from "@/lib/comparison-context"
import { useWishlist } from "@/lib/wishlist-context"

export default function PrivacyPage() {
  const { user } = useAuth()
  const { clearComparison } = useComparison()
  const { refreshWishlist } = useWishlist()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [category, setCategory] = useState<"wishlist" | "applications">("wishlist")
  const [confirmed, setConfirmed] = useState(false)

  async function clearActivity() {
    if (!confirmed) return
    setBusy(true)
    setMessage("")
    try {
      const response = await fetch("/api/privacy/activity", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category }),
      })
      if (!response.ok) throw new Error("Unable to clear this data. Please sign in again or contact admin@graduatescorner.com.")
      if (category === "wishlist") await refreshWishlist()
      setConfirmed(false)
      setMessage(category === "wishlist" ? "Your saved opportunities have been cleared." : "Your application markers have been cleared. Applications sent to employers are unaffected.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to clear your data.")
    } finally { setBusy(false) }
  }

  async function download() {
    setBusy(true)
    setMessage("")
    try {
      const response = await fetch("/api/privacy/export", { cache: "no-store" })
      if (!response.ok) throw new Error("Download unavailable. Please sign in again or contact admin@graduatescorner.com for a copy of your data.")
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement("a")
      link.href = url
      link.download = "graduates-corner-data.json"
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage("Your download contains personal information. Store it securely.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to download your data.")
    } finally {
      setBusy(false)
    }
  }

  return <PublicLayout><section className="mx-auto max-w-3xl space-y-6 px-6 py-14">
    <h1 className="text-3xl font-bold">Your privacy and data</h1>
    <p>Manage your personal information and read our <Link className="underline" href="/privacy-policy">privacy notice</Link>. Optional website analytics are disabled.</p>
    <h2 className="text-xl font-semibold">Download your account data</h2>
    <p>The JSON download includes your account details, profile, saved opportunities, application markers, and submitted content. For uploaded files, correspondence, or a full access request, contact us below.</p>
    {user ? <Button onClick={download} disabled={busy}>{busy ? "Preparing download…" : "Download my data"}</Button> : <Link className="underline" href="/login">Sign in to download your data</Link>}
    <p role="status">{message}</p>
    <h2 className="text-xl font-semibold">Clear saved activity</h2>
    <p>You can remove your saved opportunities or the markers recording that you clicked an external application link. Clearing markers does not withdraw applications submitted on another website.</p>
    {user && <div className="space-y-4 rounded-lg border p-4">
      <label className="block" htmlFor="activity-category">Data to clear</label>
      <select id="activity-category" className="rounded border bg-background p-2" value={category} disabled={busy} onChange={event => { setCategory(event.target.value as "wishlist" | "applications"); setConfirmed(false) }}>
        <option value="wishlist">Saved opportunities</option><option value="applications">Application markers</option>
      </select>
      <label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} disabled={busy} onChange={event => setConfirmed(event.target.checked)} />I understand that clearing these records cannot be undone.</label>
      <Button variant="destructive" disabled={busy || !confirmed} onClick={clearActivity}>Clear selected data</Button>
    </div>}
    <Button variant="outline" disabled={busy} onClick={() => { clearComparison(); setMessage("Your comparison list on this browser has been cleared.") }}>Clear comparison list on this browser</Button>
    <h2 className="text-xl font-semibold">Correct, delete, restrict, or object</h2>
    <p>You can edit your profile in your dashboard. To request account deletion, correction, restriction, objection, or a complete copy of your personal data, email us. You do not need an active account to make a request.</p>
    <p><a className="underline" href="mailto:admin@graduatescorner.com?subject=Personal%20data%20request">Send a privacy request to admin@graduatescorner.com</a></p>
    <p>This opens your email application; the request is sent only when you send the email. Tell us which right you wish to exercise. Do not send passwords or identity documents. We may ask for proportionate information to verify your identity.</p>
    <p>GDPR requests must normally receive a response within one month. Complex or numerous requests may take up to two additional months; we must explain an extension within the first month. Deletion requests also cover public author names, comments, and uploaded files, subject to applicable legal exceptions.</p>
  </section></PublicLayout>
}
