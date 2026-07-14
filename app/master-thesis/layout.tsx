import type { Metadata } from "next"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Master's Thesis Positions at Universities and Companies",
  description: "Find current master's thesis positions and research projects from universities and companies. Filter opportunities by field, location, compensation, and deadline.",
  path: "/master-thesis",
  keywords: ["master thesis positions", "master's thesis opportunities", "thesis projects", "company thesis", "university thesis"],
})

export default function MasterThesisLayout({ children }: { children: React.ReactNode }) {
  return children
}
