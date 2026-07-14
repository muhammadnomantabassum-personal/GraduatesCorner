import { PublicLayout } from "@/components/layout/public-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  FileText,
  Globe2,
  GraduationCap,
  Heart,
  Layers3,
  Lightbulb,
  MapPin,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

const metrics = [
  { label: "Opportunity tracks", value: "3", icon: ShieldCheck },
  { label: "Organization access", value: "Global", icon: Building2 },
  { label: "Role-based workspaces", value: "4", icon: Users },
  { label: "Publishing review", value: "Admin", icon: Globe2 },
]

const principles = [
  {
    title: "Clarity before volume",
    copy: "We surface deadline, compensation, location, field, and organization signals so candidates can act quickly.",
    icon: Target,
    color: "text-[#4285f4]",
  },
  {
    title: "Trust by design",
    copy: "Admin moderation, verified badges, and role-based dashboards keep the marketplace professional and credible.",
    icon: ShieldCheck,
    color: "text-[#34a853]",
  },
  {
    title: "Momentum for every role",
    copy: "Students save opportunities, universities publish research roles, and companies build graduate pipelines.",
    icon: Zap,
    color: "text-[#fbbc05]",
  },
]

const audienceCards = [
  {
    title: "Students",
    copy: "Discover master thesis, PhD, and trainee opportunities. Save roles to your wishlist and prioritize deadlines.",
    href: "/master-thesis",
    icon: GraduationCap,
  },
  {
    title: "Universities",
    copy: "Publish research openings, thesis projects, and doctoral opportunities to a focused graduate audience.",
    href: "/register",
    icon: BookOpen,
  },
  {
    title: "Companies",
    copy: "Promote trainee programs and industry thesis collaborations to candidates with real intent.",
    href: "/trainee-programs",
    icon: Briefcase,
  },
]

const capabilities = [
  { label: "Smart search", icon: Search },
  { label: "Wishlist workspace", icon: Heart },
  { label: "Deadline intelligence", icon: TrendingUp },
  { label: "Role dashboards", icon: Layers3 },
  { label: "Content insights", icon: FileText },
  { label: "Verified publishing", icon: CheckCircle2 },
]

const journey = [
  {
    phase: "Discover",
    title: "Find relevant opportunity signals",
    copy: "Search across thesis, PhD, trainee programs, and editorial guidance using focused filters.",
  },
  {
    phase: "Shortlist",
    title: "Save what matters",
    copy: "Wishlist-ready cards help students keep promising roles together and return when ready.",
  },
  {
    phase: "Connect",
    title: "Move from interest to action",
    copy: "Detail pages and external application links help users convert research into applications.",
  },
]

export default function AboutPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden px-4 py-16 text-primary-foreground lg:py-24">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2200&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(15,23,42,0.94)_0%,rgba(66,133,244,0.78)_48%,rgba(52,168,83,0.46)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_22%,rgba(251,188,5,0.22),transparent_20rem),radial-gradient(circle_at_20%_72%,rgba(234,67,53,0.12),transparent_22rem)]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_25rem] lg:items-end">
          <div>
            <Badge className="mb-6 gap-2 border border-white/20 bg-white/12 px-3 py-1.5 text-white backdrop-blur">
              <Network className="h-3.5 w-3.5" />
              About the platform
            </Badge>
            <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight lg:text-6xl">
              Building the operating system for graduate opportunity discovery.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/82">
              Graduates Corner connects ambitious students with thesis projects, PhD positions, trainee programs, and career intelligence from universities and companies.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="lg" className="gap-2 rounded-xl bg-white text-primary hover:bg-white/90">
                  Create free account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/master-thesis">
                <Button size="lg" variant="outline" className="gap-2 rounded-xl border-white/25 bg-white/8 text-white hover:bg-white/14 hover:text-white">
                  Browse opportunities
                  <Sparkles className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/18 bg-white/12 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.16)] backdrop-blur-xl">
            <p className="text-sm font-semibold text-white/78">Platform snapshot</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-xl bg-white/12 p-3 ring-1 ring-white/10">
                  <metric.icon className="mb-2 h-4 w-4 text-white/80" />
                  <p className="text-2xl font-bold text-white">{metric.value}</p>
                  <p className="text-[11px] font-medium text-white/62">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <Badge variant="outline" className="mb-4 gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-[#fbbc05]" />
              Why we exist
            </Badge>
            <h2 className="text-balance text-3xl font-bold text-foreground lg:text-4xl">
              Graduate decisions should feel focused, credible, and easier to act on.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground lg:text-base">
              Finding the right academic or early-career opportunity is often scattered across university pages, company portals, and informal networks. Graduates Corner brings those pathways into one structured marketplace with professional filters, verified publishing, and role-specific dashboards.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {principles.map((item) => (
              <Card key={item.title} className="border-border bg-card/92 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.copy}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/55 px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="outline" className="mb-4">Who it serves</Badge>
              <h2 className="text-3xl font-bold text-foreground lg:text-4xl">A professional network for every side of graduate opportunity.</h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              The platform is designed around real workflows: discovery for students, publishing for institutions, and pipeline-building for companies.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {audienceCards.map((audience) => (
              <Link key={audience.title} href={audience.href} className="group">
                <Card className="h-full overflow-hidden border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_22px_60px_rgba(66,133,244,0.14)]">
                  <CardContent className="p-6">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <audience.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{audience.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{audience.copy}</p>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Explore workflow
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-border bg-[linear-gradient(135deg,#ffffff_0%,#f5f9ff_48%,#edf8f1_100%)] p-6 shadow-sm lg:p-8">
            <Badge variant="outline" className="mb-4 gap-2 bg-white/70">
              <Layers3 className="h-3.5 w-3.5 text-primary" />
              Product capabilities
            </Badge>
            <h2 className="text-balance text-3xl font-bold text-foreground lg:text-4xl">
              Built like a modern marketplace, not a static notice board.
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((capability) => (
                <div key={capability.label} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                    <capability.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{capability.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-6 lg:p-8">
              <Badge className="mb-5 bg-primary/10 text-primary hover:bg-primary/10">How it works</Badge>
              <div className="space-y-5">
                {journey.map((item, index) => (
                  <div key={item.phase} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-primary">{item.phase}</p>
                      <h3 className="mt-1 font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="px-4 pb-16 lg:pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#1a73e8_0%,#4285f4_48%,#34a853_100%)] p-8 text-center text-white shadow-[0_24px_80px_rgba(66,133,244,0.24)] lg:p-12">
            <div className="absolute right-[-5rem] top-[-5rem] h-64 w-64 rounded-full bg-white/12 blur-3xl" />
            <div className="relative">
              <MapPin className="mx-auto mb-5 h-9 w-9 text-white/82" />
              <h2 className="mx-auto max-w-3xl text-balance text-3xl font-bold lg:text-4xl">
                Ready to find or publish the next graduate opportunity?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-pretty text-white/78">
                Join the platform built for academic discovery, research careers, and early professional growth.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="rounded-xl bg-white text-primary hover:bg-white/90">
                    Create free account
                  </Button>
                </Link>
                <Link href="/blog">
                  <Button size="lg" variant="outline" className="rounded-xl border-white/25 bg-white/8 text-white hover:bg-white/14 hover:text-white">
                    Read insights
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
