"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { PublicLayout } from "@/components/layout/public-layout"
import { ProgramCard } from "@/components/shared/program-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import type { TraineeProgram } from "@/lib/data/types"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building2,
  ExternalLink,
  Clock,
  Briefcase,
  Loader2,
} from "lucide-react"

export default function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const [program, setProgram] = useState<TraineeProgram | null>(null)
  const [relatedPrograms, setRelatedPrograms] = useState<TraineeProgram[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchProgram = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('trainee_programs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching trainee program:', error)
      } else if (data) {
        const formattedProgram: TraineeProgram = {
          id: data.id,
          title: data.title,
          company: data.company,
          description: data.description,
          field: data.field,
          location: data.location,
          duration: data.duration,
          compensation: data.compensation,
          deadline: data.deadline,
          postedBy: data.posted_by,
          postedByUserId: data.posted_by_user_id,
          externalUrl: data.external_url,
          status: data.status,
          createdAt: data.created_at,
        }
        setProgram(formattedProgram)

        // Fetch related programs
        const { data: relatedData } = await supabase
          .from('trainee_programs')
          .select('*')
          .eq('status', 'approved')
          .eq('field', data.field)
          .neq('id', data.id)
          .limit(2)

        if (relatedData) {
          setRelatedPrograms(relatedData.map((p: any) => ({
            id: p.id,
            title: p.title,
            company: p.company,
            description: p.description,
            field: p.field,
            location: p.location,
            duration: p.duration,
            compensation: p.compensation,
            deadline: p.deadline,
            postedBy: p.posted_by,
            postedByUserId: p.posted_by_user_id,
            externalUrl: p.external_url,
            status: p.status,
            createdAt: p.created_at,
          })))
        }
      }
      setLoading(false)
    }

    fetchProgram()
  }, [id, supabase])

  const handleApply = async () => {
    if (user?.type === "student") {
      await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          program_id: id,
        })
    }
  }

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading program details...</p>
        </div>
      </PublicLayout>
    )
  }

  if (!program) {
    return (
      <PublicLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
          <h1 className="mb-4 text-2xl font-bold text-foreground">Program Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            The program you are looking for does not exist.
          </p>
          <Link href="/trainee-programs">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Programs
            </Button>
          </Link>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <section className="border-b border-border bg-primary px-4 py-10 text-primary-foreground lg:py-14">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/trainee-programs"
            className="mb-4 inline-flex items-center gap-2 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Programs
          </Link>
          <h1 className="mb-4 flex flex-wrap items-center gap-3 text-balance text-3xl font-bold lg:text-4xl">
            {program.title}
            <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 px-2.5 py-1 text-xs font-semibold lg:text-sm">
              Trainee Program
            </Badge>
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-primary-foreground/80">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> {program.company}
              {program.postedBy === "admin" && (
                <span className="text-primary-foreground/40">· by GradNexus</span>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {program.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {program.duration}
            </span>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 lg:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="flex-1">
              <Card>
                <CardContent className="p-6 lg:p-8">
                  <h2 className="mb-4 text-xl font-semibold text-foreground">
                    Program Description
                  </h2>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    {program.description.split("\n").map((paragraph, i) => (
                      <p key={i} className="mb-4 leading-relaxed text-muted-foreground">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  <Separator className="my-6" />

                  <h2 className="mb-4 text-xl font-semibold text-foreground">Program Details</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Field</p>
                        <p className="text-sm text-muted-foreground">{program.field}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Duration</p>
                        <p className="text-sm text-muted-foreground">{program.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Location</p>
                        <p className="text-sm text-muted-foreground">{program.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Application Deadline</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(program.deadline).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="w-full shrink-0 lg:w-80">
              <div className="flex flex-col gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="mb-4 font-semibold text-foreground">Apply Now</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Applications are handled by{" "}
                      <span className="font-medium text-foreground">{program.company}</span>.
                    </p>
                    {program.externalUrl && (
                      <a 
                        href={program.externalUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={handleApply}
                      >
                        <Button className="w-full gap-2">
                          Apply at Company Website
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="mb-3 font-semibold text-foreground">
                      About {program.company}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span>Company</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{program.location}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>

          {relatedPrograms.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-6 text-xl font-semibold text-foreground">Related Programs</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {relatedPrograms.map((p) => (
                  <ProgramCard key={p.id} program={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  )
}
