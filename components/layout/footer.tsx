import Link from "next/link"
import { Github, GraduationCap, Linkedin, Mail, MapPin, ShieldCheck, Sparkles } from "lucide-react"

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
  { label: "LinkedIn", href: "https://linkedin.com", icon: Linkedin },
  { label: "GitHub", href: "https://github.com", icon: Github },
  { label: "Email", href: "mailto:hello@graduatecorner.com", icon: Mail },
]

export function Footer() {
  return (
    <footer className="border-t border-primary/20 bg-[linear-gradient(135deg,#102844_0%,#153d61_52%,#12372f_100%)]">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-14 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link href="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-[0_14px_30px_rgba(67,206,145,0.24)]">
                <GraduationCap className="h-[18px] w-[18px]" />
              </div>
              <span className="brand-wordmark text-[17px] font-bold text-primary-foreground">
                Graduates Corner
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-[14px] leading-[1.75] text-primary-foreground/68">
              Connecting ambitious graduates with world-class academic and professional
              opportunities across Sweden and all over the world.
            </p>

            <div className="mt-6 grid max-w-sm gap-2 text-[13px] text-primary-foreground/72">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                AI-ready discovery for thesis, PhD, and graduate tracks
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Curated opportunities with role-based dashboards
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" />
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/[0.08] text-primary-foreground/55 transition-all hover:bg-accent hover:text-accent-foreground"
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

        <div className="mt-12 border-t border-primary-foreground/10 pt-7">
          <p className="text-center text-[13px] text-primary-foreground/45">
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
      <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-accent">
        {title}
      </h3>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-[13.5px] font-medium text-primary-foreground/68 transition-colors hover:text-primary-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
