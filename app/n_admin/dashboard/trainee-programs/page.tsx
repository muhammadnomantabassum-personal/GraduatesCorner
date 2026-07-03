"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { TraineeProgram } from "@/lib/data/types"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Briefcase,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  XCircle,
  Loader2,
  MapPin,
  Calendar,
  BookOpen
} from "lucide-react"
import { toast } from "sonner"
import { htmlToPlainText } from "@/lib/text"

export default function AdminTraineeProgramsPage() {
  const [programs, setPrograms] = useState<TraineeProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"approved" | "pending">("approved")

  const supabase = createClient()

  const fetchPrograms = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('trainee_programs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error("Failed to fetch trainee programs")
    } else {
      setPrograms(data.map((p: any) => ({
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
    setLoading(false)
  }

  useEffect(() => {
    fetchPrograms()
  }, [supabase])

  const approved = programs.filter((p) => p.status === "approved")
  const pending = programs.filter((p) => p.status === "pending")

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('trainee_programs')
      .update({ status: 'approved' })
      .eq('id', id)

    if (error) {
      toast.error("Failed to approve program")
    } else {
      toast.success("Program approved and published!")
      fetchPrograms()
    }
  }

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('trainee_programs')
      .update({ status: 'rejected' })
      .eq('id', id)

    if (error) {
      toast.error("Failed to reject program")
    } else {
      toast.success("Program rejected")
      fetchPrograms()
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('trainee_programs')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error("Failed to delete program")
    } else {
      toast.success("Program deleted")
      fetchPrograms()
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground sm:text-xl">Manage All Program</h1>
          <p className="text-sm text-muted-foreground">
            Approve, reject, programs listed by Companies and Organizations
          </p>
        </div>
        <Link href="/n_admin/dashboard/trainee-programs/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Post Program
          </Button>
        </Link>
      </div>

      {/* Tab Switcher */}
      <div className="mb-5 flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("approved")}
          className={`flex shrink-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-all ${activeTab === "approved"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Approved
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${activeTab === "approved"
            ? "bg-emerald-500/10 text-emerald-700"
            : "bg-muted text-muted-foreground"
            }`}>
            {approved.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex shrink-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-all ${activeTab === "pending"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Waiting for Approval</span>
          <span className="sm:hidden">Pending</span>
          {pending.length > 0 && (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${activeTab === "pending"
              ? "bg-amber-500/10 text-amber-700"
              : "bg-amber-500/10 text-amber-700"
              }`}>
              {pending.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground text-sm">Loading programs...</p>
        </div>
      ) : activeTab === "approved" ? (
        <div>
          {approved.length > 0 ? (
            <div className="flex flex-col gap-3">
              {approved.map((program) => (
                <Card key={program.id} className="transition-all duration-200 hover:shadow-md border-l-[3px] border-l-emerald-500">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground leading-snug">
                          {program.title}
                        </h3>
                        <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-primary/70" />
                              {program.field}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="h-3.5 w-3.5 text-primary/70" />
                              {program.company}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-primary/70" />
                              {program.duration}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-primary/70" />
                              {program.location}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-primary/70" />
                              Deadline: {new Date(program.deadline).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Link href={`/trainee-programs/${program.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(program.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">No approved programs</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div>
          {pending.length > 0 ? (
            <div className="flex flex-col gap-3">
              {pending.map((program) => (
                <Card key={program.id} className="border-l-[3px] border-l-amber-500">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="text-[10px] font-medium bg-amber-500/10 text-amber-700 hover:bg-amber-500/10">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending Review
                          </Badge>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground leading-snug">
                          {program.title}
                        </h3>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {htmlToPlainText(program.description)}
                        </p>
                        <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-primary/70" />
                              {program.field}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="h-3.5 w-3.5 text-primary/70" />
                              {program.company}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-primary/70" />
                              {program.duration}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-primary/70" />
                              {program.location}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border-t border-border/50 pt-3">
                        <Button
                          size="sm"
                          className="h-8 gap-1.5 bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-700"
                          onClick={() => handleApprove(program.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                          onClick={() => handleReject(program.id)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500/30" />
                <p className="text-sm font-medium text-foreground">All caught up!</p>
                <p className="mt-1 text-xs text-muted-foreground">No programs waiting for approval</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
