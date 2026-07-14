import type { Metadata } from "next"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Terms of Service",
  description: "Read the terms governing accounts, opportunity listings, applications, user content, and use of the Graduates Corner platform.",
  path: "/terms-of-service",
})

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
