"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Calendar,
  BookOpen
} from "lucide-react"
import type { ApprovalStatus, TraineeProgram } from "@/lib/data/types"
import { toast } from "sonner"
import { htmlToPlainText } from "@/lib/text"

type FilterTab = "all" | ApprovalStatus

export default function CompanyTraineeProgramsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const [myPrograms, setMyPrograms] = useState<TraineeProgram[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchMyPrograms = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('trainee_programs')
      .select('*')
      .eq('posted_by_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error("Failed to fetch your programs")
    } else {
      setMyPrograms(data.map((p: any) => ({
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
  }, [user, supabase])

  useEffect(() => {
    fetchMyPrograms()
  }, [fetchMyPrograms])

  const filtered = useMemo(() =>
    activeTab === "all" ? myPrograms : myPrograms.filter((p) => p.status === activeTab),
    [myPrograms, activeTab]
  )

  const counts = {
    all: myPrograms.length,
    approved: myPrograms.filter((p) => p.status === "approved").length,
    pending: myPrograms.filter((p) => p.status === "pending").length,
    rejected: myPrograms.filter((p) => p.status === "rejected").length,
  }

  const tabs: { key: FilterTab; label: string; icon: typeof FileText }[] = [
    { key: "all", label: "All", icon: Briefcase },
    { key: "approved", label: "Approved", icon: CheckCircle2 },
    { key: "pending", label: "Pending", icon: Clock },
    { key: "rejected", label: "Rejected", icon: XCircle },
  ]

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Trainee Programs</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track your graduate trainee programs
          </p>
        </div>
        <Link href="/dashboard/company/trainee-programs/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Post Program
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/30 p-1 scrollbar-none">
        {tabs
          .filter((t) => t.key !== "rejected" || counts.rejected > 0)
          .map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all ${activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${activeTab === tab.key
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                  }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
      </div>

      {/* Program List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground text-sm">Loading your programs...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map((program) => (
            <Card
              key={program.id}
              className={`transition-all duration-200 hover:shadow-md border-l-[3px] ${program.status === "approved"
                  ? "border-l-emerald-500"
                  : program.status === "pending"
                    ? "border-l-amber-500"
                    : "border-l-destructive"
                }`}
            >
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={`text-[10px] font-medium ${program.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
                            : program.status === "pending"
                              ? "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10"
                              : "bg-destructive/10 text-destructive hover:bg-destructive/10"
                          }`}
                      >
                        {program.status === "approved" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {program.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                        {program.status === "rejected" && <XCircle className="mr-1 h-3 w-3" />}
                        {program.status === "approved"
                          ? "Approved"
                          : program.status === "pending"
                            ? "Pending Review"
                            : "Rejected"}
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
                  {program.status === "approved" && (
                    <Link href={`/trainee-programs/${program.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-1 text-base font-semibold text-foreground">
              {activeTab === "all" ? "No trainee programs yet" : `No ${activeTab} programs`}
            </h3>
            <p className="mb-5 text-sm text-muted-foreground">
              {activeTab === "all"
                ? "Start by posting your first graduate trainee program"
                : `You don't have any ${activeTab} trainee programs`}
            </p>
            {activeTab === "all" && (
              <Link href="/dashboard/company/trainee-programs/new">
                <Button className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Post Your First Program
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
