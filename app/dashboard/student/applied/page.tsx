"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThesisCard } from "@/components/shared/thesis-card"
import { ProgramCard } from "@/components/shared/program-card"
import type { Thesis, TraineeProgram } from "@/lib/data/types"
import { BookOpen, Briefcase, GraduationCap, Send, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function StudentAppliedPage() {
  const { user, supabase } = useAuth()
  const [appliedTheses, setAppliedTheses] = useState<Thesis[]>([])
  const [appliedPrograms, setAppliedPrograms] = useState<TraineeProgram[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAppliedData = async () => {
      if (!user || user.type !== 'student') return

      setLoading(true)

      const { data, error } = await supabase
        .from('applications')
        .select(`
          thesis_id,
          program_id,
          theses (*, profiles:posted_by_user_id (is_verified, verification_badge)),
          trainee_programs (*, profiles:posted_by_user_id (is_verified, verification_badge))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Unable to load applications.")
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

        setAppliedTheses(theses)
        setAppliedPrograms(programs)
      }

      setLoading(false)
    }

    fetchAppliedData()
  }, [user, supabase])

  const totalApplied = appliedTheses.length + appliedPrograms.length

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Applied Posts</h1>
          <p className="text-sm text-muted-foreground">Posts where you clicked &ldquo;Apply on Company Website&rdquo;</p>
        </div>
        <Badge variant="outline" className="h-7 gap-1.5 px-3 font-medium">
          <Send className="h-3.5 w-3.5 text-primary" />
          {totalApplied} Applications
        </Badge>
      </div>

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : totalApplied > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {appliedTheses.map((thesis) => (
            <ThesisCard key={thesis.id} thesis={thesis} />
          ))}
          {appliedPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/5">
              <Send className="h-10 w-10 text-primary/20" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">No applications yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              You haven&apos;t applied to any posts yet. Browse opportunities and click apply to track them here.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/master-thesis">
                <Button className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Find a Thesis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/phd-positions">
                <Button variant="outline" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Find a PhD
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/trainee-programs">
                <Button variant="outline" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  Find a Trainee Program
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
