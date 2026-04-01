"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  BookOpen,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Calendar,
  Building2,
  GraduationCap,
} from "lucide-react"
import type { ApprovalStatus, Thesis } from "@/lib/data/types"
import { toast } from "sonner"

type FilterTab = "all" | ApprovalStatus

export default function UniversityThesesPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const [myTheses, setMyTheses] = useState<Thesis[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchMyTheses = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('theses')
      .select('*')
      .eq('posted_by_user_id', user.id)
      .eq('type', 'master')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error("Failed to fetch your thesis")
    } else {
      setMyTheses(data.map((t: any) => ({
        id: t.id,
        title: t.title,
        type: t.type,
        description: t.description,
        subject: t.subject,
        organization: t.organization,
        organizationType: t.organization_type,
        location: t.location,
        compensation: t.compensation,
        deadline: t.deadline,
        postedBy: t.posted_by,
        postedByUserId: t.posted_by_user_id,
        externalUrl: t.external_url,
        status: t.status,
        createdAt: t.created_at,
      })))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMyTheses()
  }, [user, supabase])

  const filtered = useMemo(() =>
    activeTab === "all" ? myTheses : myTheses.filter((t) => t.status === activeTab),
    [myTheses, activeTab]
  )

  const counts = {
    all: myTheses.length,
    approved: myTheses.filter((t) => t.status === "approved").length,
    pending: myTheses.filter((t) => t.status === "pending").length,
    rejected: myTheses.filter((t) => t.status === "rejected").length,
  }

  const tabs: { key: FilterTab; label: string; icon: typeof FileText }[] = [
    { key: "all", label: "All", icon: BookOpen },
    { key: "approved", label: "Approved", icon: CheckCircle2 },
    { key: "pending", label: "Pending", icon: Clock },
    { key: "rejected", label: "Rejected", icon: XCircle },
  ]

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground sm:text-xl">Master Thesis</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track your master thesis postings
          </p>
        </div>
        <Link href="/dashboard/university/theses/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Post Master Thesis
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
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  activeTab === tab.key
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
      </div>

      {/* Thesis List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground text-sm">Loading your master thesis...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map((thesis) => (
            <Card
              key={thesis.id}
              className={`transition-all duration-200 hover:shadow-md border-l-[3px] ${
                thesis.status === "approved"
                  ? "border-l-emerald-500"
                  : thesis.status === "pending"
                    ? "border-l-amber-500"
                    : "border-l-destructive"
              }`}
            >
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={`text-[10px] font-medium ${
                          thesis.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
                            : thesis.status === "pending"
                              ? "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10"
                              : "bg-destructive/10 text-destructive hover:bg-destructive/10"
                        }`}
                      >
                        {thesis.status === "approved" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {thesis.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                        {thesis.status === "rejected" && <XCircle className="mr-1 h-3 w-3" />}
                        {thesis.status === "approved"
                          ? "Approved"
                          : thesis.status === "pending"
                            ? "Pending Review"
                            : "Rejected"}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground leading-snug">
                      {thesis.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {thesis.description}
                    </p>
                    <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-primary/70" />
                          {thesis.subject}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {thesis.organizationType === "university"
                            ? <GraduationCap className="h-3.5 w-3.5 text-primary/70" />
                            : <Building2 className="h-3.5 w-3.5 text-primary/70" />}
                          {thesis.organization}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary/70" />
                          {thesis.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary/70" />
                          Deadline: {new Date(thesis.deadline).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {thesis.status === "approved" && (
                    <Link href={`/theses/${thesis.id}`}>
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
          <CardContent className="flex flex-col items-center justify-center py-10 text-center sm:py-16">
            <BookOpen className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-1 text-base font-semibold text-foreground">
              {activeTab === "all" ? "No thesis posted yet" : `No ${activeTab} thesis`}
            </h3>
            <p className="mb-5 text-sm text-muted-foreground">
              {activeTab === "all"
                ? "Start by posting your first thesis position"
                : `You don't have any ${activeTab} thesis postings`}
            </p>
            {activeTab === "all" && (
              <Link href="/dashboard/university/theses/new">
                <Button className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Post Your First Master Thesis
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
