"use client"

import { useEffect, useMemo, useState } from "react"
import type { ElementType } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThesisCard } from "@/components/shared/thesis-card"
import { ProgramCard } from "@/components/shared/program-card"
import type { Thesis, TraineeProgram } from "@/lib/data/types"
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CalendarClock,
  Heart,
  Loader2,
  Search,
  Sparkles,
  Target,
} from "lucide-react"

export default function StudentWishlistPage() {
  const { user, supabase } = useAuth()
  const [wishlistTheses, setWishlistTheses] = useState<Thesis[]>([])
  const [wishlistPrograms, setWishlistPrograms] = useState<TraineeProgram[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWishlistData = async () => {
      if (!user || user.type !== "student") {
        setWishlistTheses([])
        setWishlistPrograms([])
        setLoading(false)
        return
      }

      setLoading(true)

      const { data, error } = await supabase
        .from("wishlist")
        .select(`
          thesis_id,
          program_id,
          theses (*, profiles:posted_by_user_id (is_verified, verification_badge)),
          trainee_programs (*, profiles:posted_by_user_id (is_verified, verification_badge))
        `)
        .eq("user_id", user.id)

      if (error) {
        console.error("Unable to load the wishlist.")
      } else if (data) {
        const theses = data
          .filter((item: any) => item.theses)
          .map((item: any) => ({
            id: item.theses.id,
            title: item.theses.title,
            type: item.theses.type,
            description: item.theses.description,
            subject: item.theses.subject,
            organization: item.theses.organization,
            organizationType: item.theses.organization_type,
            location: item.theses.location,
            compensation: item.theses.compensation,
            deadline: item.theses.deadline,
            postedBy: item.theses.posted_by,
            postedByUserId: item.theses.posted_by_user_id,
            externalUrl: item.theses.external_url,
            status: item.theses.status,
            createdAt: item.theses.created_at,
            organizationVerified: item.theses.posted_by === "admin" || Boolean(item.theses.profiles?.is_verified),
            verificationBadge: item.theses.profiles?.verification_badge || "verified",
          }))

        const programs = data
          .filter((item: any) => item.trainee_programs)
          .map((item: any) => ({
            id: item.trainee_programs.id,
            title: item.trainee_programs.title,
            company: item.trainee_programs.company,
            description: item.trainee_programs.description,
            field: item.trainee_programs.field,
            location: item.trainee_programs.location,
            duration: item.trainee_programs.duration,
            compensation: item.trainee_programs.compensation,
            deadline: item.trainee_programs.deadline,
            postedBy: item.trainee_programs.posted_by,
            postedByUserId: item.trainee_programs.posted_by_user_id,
            externalUrl: item.trainee_programs.external_url,
            status: item.trainee_programs.status,
            createdAt: item.trainee_programs.created_at,
            organizationVerified: item.trainee_programs.posted_by === "admin" || Boolean(item.trainee_programs.profiles?.is_verified),
            verificationBadge: item.trainee_programs.profiles?.verification_badge || "verified",
          }))

        setWishlistTheses(theses)
        setWishlistPrograms(programs)
      }

      setLoading(false)
    }

    fetchWishlistData()
  }, [user, supabase])

  const totalWishlist = wishlistTheses.length + wishlistPrograms.length
  const phdCount = wishlistTheses.filter((item) => item.type === "phd").length
  const masterCount = wishlistTheses.filter((item) => item.type === "master").length
  const nextDeadline = useMemo(() => {
    const allDates = [...wishlistTheses, ...wishlistPrograms]
      .map((item) => new Date(item.deadline))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())

    return allDates[0]
  }, [wishlistTheses, wishlistPrograms])

  return (
    <div className="mx-auto max-w-7xl">
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,#ffffff_0%,#f3f8ff_46%,#edf8f1_100%)] p-6 shadow-sm">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-4 gap-2 bg-primary/10 text-primary hover:bg-primary/10">
              <Heart className="h-3.5 w-3.5" />
              Saved opportunity workspace
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Wishlist</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Keep your best-fit thesis, PhD, and trainee opportunities in one place, then return when you are ready to apply.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/master-thesis">
              <Button variant="outline" className="gap-2 bg-white/80">
                <BookOpen className="h-4 w-4" />
                Browse thesis
              </Button>
            </Link>
            <Link href="/trainee-programs">
              <Button className="gap-2">
                <Search className="h-4 w-4" />
                Find programs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <WishlistMetric icon={Heart} label="Saved items" value={totalWishlist.toString()} color="text-[#ea4335]" />
        <WishlistMetric icon={BookOpen} label="Master thesis" value={masterCount.toString()} color="text-primary" />
        <WishlistMetric icon={Target} label="PhD positions" value={phdCount.toString()} color="text-[#34a853]" />
        <WishlistMetric
          icon={CalendarClock}
          label="Next deadline"
          value={nextDeadline ? nextDeadline.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "-"}
          color="text-[#fbbc05]"
        />
      </div>

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : totalWishlist > 0 ? (
        <div className="space-y-10">
          {wishlistTheses.length > 0 && (
            <section>
              <SectionHeader
                icon={BookOpen}
                title="Saved thesis and PhD positions"
                count={wishlistTheses.length}
                href="/master-thesis"
              />
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {wishlistTheses.map((thesis) => (
                  <ThesisCard key={thesis.id} thesis={thesis} />
                ))}
              </div>
            </section>
          )}

          {wishlistPrograms.length > 0 && (
            <section>
              <SectionHeader
                icon={Briefcase}
                title="Saved trainee programs"
                count={wishlistPrograms.length}
                href="/trainee-programs"
              />
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {wishlistPrograms.map((program) => (
                  <ProgramCard key={program.id} program={program} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <Card className="overflow-hidden border-dashed">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
            <div className="flex flex-col justify-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#ea4335]/10">
                <Heart className="h-10 w-10 text-[#ea4335]" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground">Start your shortlist</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Save promising opportunities with the heart icon, then compare deadlines, tracks, and organizations from this workspace.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/phd-positions">
                  <Button variant="outline" className="gap-2">
                    Explore PhD roles
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/trainee-programs">
                  <Button className="gap-2">
                    Browse programs
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/45 p-5">
              <p className="mb-4 text-sm font-semibold text-foreground">Suggested workflow</p>
              <div className="grid gap-3">
                {[
                  "Save roles that match your field and location.",
                  "Return weekly and check the nearest deadlines.",
                  "Open the strongest cards and apply from the detail page.",
                ].map((item, index) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl bg-card p-3 text-sm text-muted-foreground">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function WishlistMetric({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: ElementType
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  count,
  href,
}: {
  icon: ElementType
  title: string
  count: number
  href: string
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{count} saved</p>
        </div>
      </div>
      <Link href={href}>
        <Button variant="ghost" className="gap-2 text-primary">
          Add more
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  )
}
