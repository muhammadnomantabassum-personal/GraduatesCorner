import type { Metadata } from "next"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description: "Read the Graduates Corner privacy policy and learn how account, profile, application, and platform data is handled.",
  path: "/privacy-policy",
})

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
