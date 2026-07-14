import type { Metadata } from "next"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Graduate Trainee Programs and Early-Career Opportunities",
  description: "Discover graduate trainee programs, rotational schemes, and early-career opportunities from companies worldwide. Compare field, location, duration, and deadline.",
  path: "/trainee-programs",
  keywords: ["graduate trainee programs", "graduate programs", "trainee jobs", "early career programs", "rotational graduate schemes"],
})

export default function TraineeProgramsLayout({ children }: { children: React.ReactNode }) {
  return children
}
