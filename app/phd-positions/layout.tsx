import type { Metadata } from "next"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "PhD Positions and Funded Doctoral Opportunities",
  description: "Search current funded PhD positions and doctoral opportunities by research field, university, country, deadline, work mode, and verified organization.",
  path: "/phd-positions",
  keywords: ["PhD positions", "funded PhD positions", "doctoral positions", "PhD opportunities", "academic jobs"],
})

export default function PhdPositionsLayout({ children }: { children: React.ReactNode }) {
  return children
}
