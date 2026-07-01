import Link from "next/link"
import {
  FileText,
  Building2,
  Users,
} from "lucide-react"
import { TestimonialCarousel } from "./testimonial-carousel"
import { BrandLogo } from "@/components/shared/brand-logo"

const stats = [
  { value: "420+", label: "Opportunities", icon: FileText },
  { value: "60+", label: "Organizations", icon: Building2 },
  { value: "2.5K+", label: "Students", icon: Users },
]

export function AuthBrandingPanel() {
  return (
    <div className="relative hidden w-[40%] flex-col justify-between overflow-hidden bg-primary p-8 lg:flex lg:p-10 xl:p-12 2xl:p-14">
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/40" />

      {/* Logo */}
      <Link href="/" aria-label="Graduates Corner home" className="relative z-10 flex items-center transition-opacity hover:opacity-95">
        <BrandLogo size="md" variant="dark" textClassName="text-[15px] xl:text-base" />
      </Link>

      {/* Hero text */}
      <div className="relative z-10 space-y-5 xl:space-y-7">
        <div className="space-y-2.5 xl:space-y-3">
          <h1 className="text-balance text-[22px] font-semibold leading-[1.25] tracking-tight text-primary-foreground lg:text-[24px] xl:text-[28px] 2xl:text-[32px]">
            Where Academic Ideas
            <br />
            Meet Industry Impact
          </h1>
          <p className="max-w-[300px] text-pretty text-[12.5px] leading-[1.65] text-primary-foreground/50 xl:max-w-[340px] xl:text-[13.5px]">
            Join thousands of students, universities, and companies collaborating on meaningful
            thesis projects across Scandinavia.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 xl:gap-7">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-0.5">
              <p className="text-lg font-semibold tracking-tight text-primary-foreground lg:text-xl xl:text-[22px]">{stat.value}</p>
              <p className="text-[10.5px] text-primary-foreground/38 lg:text-[11px] xl:text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial carousel */}
      <TestimonialCarousel />
    </div>
  )
}
