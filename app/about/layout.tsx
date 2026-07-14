import type { Metadata } from "next"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "About Graduates Corner",
  description: "Learn how Graduates Corner connects students and graduates with credible PhD positions, master's thesis projects, and trainee programs worldwide.",
  path: "/about",
})

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
