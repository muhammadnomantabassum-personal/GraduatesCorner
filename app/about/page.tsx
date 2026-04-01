import { PublicLayout } from "@/components/layout/public-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  GraduationCap,
  Building2,
  Briefcase,
  Search,
  FileText,
  CheckCircle,
  ArrowRight,
  Users,
  Globe,
  BookOpen,
} from "lucide-react"

const steps = {
  students: [
    { icon: Search, title: "Browse", description: "Search theses and trainee programs using filters" },
    { icon: FileText, title: "Discover", description: "Read detailed descriptions and requirements" },
    { icon: ArrowRight, title: "Apply", description: "Follow the external link to apply directly" },
  ],
  universities: [
    { icon: FileText, title: "Register", description: "Create a university account on the platform" },
    { icon: BookOpen, title: "Post", description: "List your thesis positions with full details" },
    { icon: Users, title: "Connect", description: "Reach qualified candidates from around the world" },
  ],
  companies: [
    { icon: FileText, title: "Register", description: "Create a company account on the platform" },
    { icon: Briefcase, title: "Post", description: "List trainee programs and industry theses" },
    { icon: CheckCircle, title: "Recruit", description: "Find motivated graduates for your programs" },
  ],
}

export default function AboutPage() {
  return (
    <PublicLayout>
      <section className="border-b border-border bg-primary px-4 py-16 text-primary-foreground lg:py-20">
        <div className="mx-auto max-w-7xl text-center">
          <GraduationCap className="mx-auto mb-6 h-14 w-14" />
          <h1 className="mb-4 text-balance text-3xl font-bold lg:text-5xl">About GradNexus</h1>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-primary-foreground/80">
            We bridge the gap between ambitious graduates and world-class academic and professional
            opportunities. Our mission is to make finding thesis positions and trainee programs
            simple, transparent, and accessible to everyone.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="text-center">
              <CardContent className="p-6">
                <Globe className="mx-auto mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">Global Reach</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Connecting students with opportunities across Europe and beyond, breaking down
                  geographical barriers in academic recruitment.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <BookOpen className="mx-auto mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">Knowledge Hub</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Our blog provides career guidance, academic insights, and success stories to help
                  graduates make informed decisions about their future.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <Users className="mx-auto mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">Trusted Community</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Over 120 partner universities and companies trust GradNexus to connect them
                  with qualified, motivated candidates.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/50 px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-foreground lg:text-3xl">
            How It Works
          </h2>
          <div className="flex flex-col gap-12">
            {(
              [
                { key: "students", label: "For Students", icon: GraduationCap },
                { key: "universities", label: "For Universities", icon: Building2 },
                { key: "companies", label: "For Companies", icon: Briefcase },
              ] as const
            ).map((section) => (
              <div key={section.key}>
                <div className="mb-6 flex items-center gap-3">
                  <section.icon className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">{section.label}</h3>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  {steps[section.key].map((step, i) => (
                    <Card key={step.title}>
                      <CardContent className="flex items-start gap-4 p-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          {i + 1}
                        </div>
                        <div>
                          <h4 className="mb-1 font-semibold text-foreground">{step.title}</h4>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-foreground lg:text-3xl">
            Ready to Get Started?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Join thousands of students, universities, and companies already using GradNexus.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg">Create Free Account</Button>
            </Link>
            <Link href="/master-thesis">
              <Button size="lg" variant="outline">
                Browse Opportunities
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
