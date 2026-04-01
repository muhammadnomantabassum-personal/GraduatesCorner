"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Thesis } from "@/lib/data/types"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  GraduationCap,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  XCircle,
  Loader2,
  MapPin,
  Calendar,
  Building2,
  BookOpen,
} from "lucide-react"
import { toast } from "sonner"

export default function AdminPhDPositionsPage() {
  const [theses, setTheses] = useState<Thesis[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"approved" | "pending">("approved")

  const supabase = createClient()

  const fetchTheses = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('theses')
      .select(`
        *,
        profiles:posted_by_user_id (
          name,
          type
        )
      `)
      .eq('type', 'phd')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error("Failed to fetch PhD positions")
    } else {
      setTheses(data.map((t: any) => ({
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
        creatorName: t.profiles?.name,
        creatorType: t.profiles?.type
      })))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTheses()
  }, [supabase])

  const approved = theses.filter((t) => t.status === "approved")
  const pending = theses.filter((t) => t.status === "pending")

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('theses')
      .update({ status: 'approved' })
      .eq('id', id)

    if (error) {
      toast.error("Failed to approve PhD position")
    } else {
      toast.success("PhD position approved and published!")
      fetchTheses()
    }
  }

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('theses')
      .update({ status: 'rejected' })
      .eq('id', id)

    if (error) {
      toast.error("Failed to reject PhD position")
    } else {
      toast.success("PhD position rejected")
      fetchTheses()
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('theses')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error("Failed to delete PhD position")
    } else {
      toast.success("PhD position deleted")
      fetchTheses()
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground sm:text-xl">PhD Positions</h1>
          <p className="text-sm text-muted-foreground">
            Approve, reject, or remove PhD position postings
          </p>
        </div>
        <Link href="/n_admin/dashboard/phd-positions/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Post PHD Positions
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
          <p className="mt-4 text-muted-foreground text-sm">Loading PhD positions...</p>
        </div>
      ) : activeTab === "approved" ? (
        <div>
          {approved.length > 0 ? (
            <div className="flex flex-col gap-3">
              {approved.map((thesis) => (
                <Card key={thesis.id} className="transition-all duration-200 hover:shadow-md border-l-[3px] border-l-emerald-500">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground leading-snug">
                          {thesis.title}
                        </h3>
                        <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-primary/70" />
                              {thesis.subject}
                            </span>
                            {/* {thesis.creatorName && (
                              <span className="flex items-center gap-1.5 text-primary/80 font-medium">
                                By: {thesis.creatorName} ({thesis.creatorType})
                              </span>
                            )} */}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                            <span className="flex items-center gap-1.5">
                              {thesis.organizationType === "university"
                                ? <GraduationCap className="h-3.5 w-3.5 text-primary/70" />
                                : <Building2 className="h-3.5 w-3.5 text-primary/70" />}
                              {thesis.organization}
                            </span>
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
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Link href={`/theses/${thesis.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(thesis.id)}
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
                <GraduationCap className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">No approved PhD positions</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div>
          {pending.length > 0 ? (
            <div className="flex flex-col gap-3">
              {pending.map((thesis) => (
                <Card key={thesis.id} className="border-l-[3px] border-l-amber-500">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="text-[10px] font-medium bg-amber-500/10 text-amber-700 hover:bg-amber-500/10">
                              <Clock className="mr-1 h-3 w-3" />
                              Pending Review
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
                              {/* {thesis.creatorName && (
                                <span className="flex items-center gap-1.5 text-primary/80 font-medium">
                                  By: {thesis.creatorName} ({thesis.creatorType})
                                </span>
                              )} */}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                              <span className="flex items-center gap-1.5">
                                {thesis.organizationType === "university"
                                  ? <GraduationCap className="h-3.5 w-3.5 text-primary/70" />
                                  : <Building2 className="h-3.5 w-3.5 text-primary/70" />}
                                {thesis.organization}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-primary/70" />
                                {thesis.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border-t border-border/50 pt-3">
                        <Button
                          size="sm"
                          className="h-8 gap-1.5 bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-700"
                          onClick={() => handleApprove(thesis.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                          onClick={() => handleReject(thesis.id)}
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
                <p className="mt-1 text-xs text-muted-foreground">No PhD positions waiting for approval</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
