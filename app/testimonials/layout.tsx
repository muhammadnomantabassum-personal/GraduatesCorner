import type { Metadata } from "next"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Graduate and Organization Success Stories",
  description: "Read experiences from students, universities, and companies using Graduates Corner for academic and early-career opportunities.",
  path: "/testimonials",
})

export default function TestimonialsLayout({ children }: { children: React.ReactNode }) {
  return children
}
