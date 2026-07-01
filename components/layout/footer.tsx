import Link from "next/link"
import { Github, Linkedin, Mail, MapPin, ShieldCheck, Sparkles } from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"

const footerLinks = {
  platform: [
    { href: "/master-thesis", label: "Master's Theses" },
    { href: "/phd-positions", label: "PhD Positions" },
    { href: "/trainee-programs", label: "Trainee Programs" },
    { href: "/blog", label: "Blog" },
    { href: "/testimonials", label: "Testimonials" },
  ],
  resources: [
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
    { href: "/about", label: "About Us" },
  ],
  legal: [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-of-service", label: "Terms of Service" },
  ],
}

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/graduatescorner/", icon: Linkedin },
  { label: "GitHub", href: "https://github.com/muhammadnomantabassum-personal", icon: Github },
  { label: "Email", href: "mailto:admin@graduatescorner.com", icon: Mail },
]

export function Footer() {
  return (
    <footer className="border-t border-primary/20 bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_46%,#eaf7ef_100%)]">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-14 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link href="/" aria-label="Graduates Corner home" className="inline-flex items-center transition-opacity hover:opacity-95">
              <BrandLogo size="md" textClassName="font-bold" />
            </Link>
            <p className="mt-4 max-w-sm text-[14px] leading-[1.75] text-muted-foreground">
              Connecting ambitious graduates with world-class academic and professional
              opportunities across Sweden and all over the world.
            </p>

            <div className="mt-6 grid max-w-sm gap-2 text-[13px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#fbbc05]" />
                AI-ready discovery for thesis, PhD, and graduate tracks
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#34a853]" />
                Curated opportunities with role-based dashboards
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#ea4335]" />
                Built for Sweden, Europe, and global candidates
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary hover:text-primary-foreground"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 lg:col-span-7">
            <FooterColumn title="Platform" links={footerLinks.platform} />
            <FooterColumn title="Resources" links={footerLinks.resources} />
            <FooterColumn title="Legal" links={footerLinks.legal} />
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-7">
          <p className="text-center text-[13px] text-muted-foreground">
            Copyright {new Date().getFullYear()} Graduates Corner. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: Array<{ href: string; label: string }>
}) {
  return (
    <div>
      <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-primary">
        {title}
      </h3>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
