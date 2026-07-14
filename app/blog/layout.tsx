import type { Metadata } from "next"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "PhD, Thesis and Graduate Career Guides",
  description: "Read practical guidance for PhD applications, master's thesis searches, academic CVs, cover letters, interviews, and graduate career decisions.",
  path: "/blog",
  keywords: ["PhD application guide", "academic CV", "cover letter", "master thesis guide", "graduate career advice"],
})

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
