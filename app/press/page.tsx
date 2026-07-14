import type { Metadata } from "next"
import Link from "next/link"
import { Download, ExternalLink, Linkedin, Mail, Newspaper, ShieldCheck } from "lucide-react"
import { PublicLayout } from "@/components/layout/public-layout"
import { BrandLogo } from "@/components/shared/brand-logo"
import { Button } from "@/components/ui/button"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Press, Partnerships and Brand Resources",
  description: "Official Graduates Corner information, brand resources, platform links, and contact details for universities, companies, partners, and journalists.",
  path: "/press",
  keywords: ["Graduates Corner press", "university partnerships", "graduate recruitment partnerships"],
})

const officialLinks = [
  { href: "/phd-positions", label: "PhD positions" },
  { href: "/master-thesis", label: "Master's thesis positions" },
  { href: "/trainee-programs", label: "Graduate trainee programs" },
  { href: "/blog", label: "Career and application guides" },
]

export default function PressPage() {
  return (
    <PublicLayout>
      <section className="border-b border-border bg-card/70 px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold text-primary">Official resources</p>
          <h1 className="mt-2 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Press and partnerships
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            Verified information and assets for universities, companies, student organizations, directories, and journalists referencing Graduates Corner.
          </p>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="grid gap-8 border-b border-border pb-12 md:grid-cols-[0.7fr_1.3fr]">
            <div>
              <BrandLogo size="lg" />
              <div className="mt-6 flex flex-wrap gap-2">
                <a href="/logo.png" download>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Logo
                  </Button>
                </a>
                <a href="/og-image.png" download>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Social image
                  </Button>
                </a>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Official description</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Graduates Corner is an international opportunity platform connecting students and graduates with current PhD positions, master&apos;s thesis projects, and graduate trainee programs from universities, research institutions, and companies.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                When referencing the platform, use the name <strong className="text-foreground">Graduates Corner</strong> and link to the most relevant official page rather than copying an opportunity description without attribution.
              </p>
            </div>
          </div>

          <div className="grid gap-8 border-b border-border pb-12 md:grid-cols-2">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <Newspaper className="h-5 w-5 text-primary" />
                Citation links
              </h2>
              <nav className="mt-4 flex flex-col gap-3" aria-label="Official Graduates Corner pages">
                {officialLinks.map((item) => (
                  <Link key={item.href} href={item.href} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                    {item.label}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </nav>
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <ShieldCheck className="h-5 w-5 text-[#34a853]" />
                Editorial standards
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Opportunity pages are reviewed through the platform&apos;s publishing workflow. Applicants should always confirm final requirements and submit applications through the official organization destination shown on each listing.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">Partnership and media contact</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
              Contact the administrator for university and company partnerships, corrections, research-data requests, interviews, or media questions.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="mailto:admin@graduatescorner.com?subject=Graduates%20Corner%20partnership%20or%20media%20inquiry">
                <Button className="gap-2">
                  <Mail className="h-4 w-4" />
                  admin@graduatescorner.com
                </Button>
              </a>
              <a href="https://www.linkedin.com/company/graduatescorner/" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
