"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { Testimonial } from "@/lib/data/types"
import {
  MessageSquare,
  Trash2,
  Star,
  Quote,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"approved" | "pending">("approved")

  const supabase = createClient()

  const fetchTestimonials = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('testimonials')
      .select('*, profiles(avatar)')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error("Failed to fetch testimonials")
    } else {
      setTestimonials(data.map((t: any) => ({
        id: t.id,
        author: t.author,
        role: t.role,
        organization: t.organization,
        content: t.content,
        rating: t.rating,
        status: t.status,
        createdAt: t.created_at,
        userId: t.user_id,
        avatar: t.profiles?.avatar || undefined,
      })))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTestimonials()
  }, [supabase])

  const approved = testimonials.filter((t) => t.status === "approved")
  const pending = testimonials.filter((t) => t.status === "pending")

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('testimonials')
      .update({ status: 'approved' })
      .eq('id', id)

    if (error) {
      toast.error("Failed to approve testimonial")
    } else {
      toast.success("Testimonial approved!")
      fetchTestimonials()
    }
  }

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('testimonials')
      .update({ status: 'rejected' })
      .eq('id', id)

    if (error) {
      toast.error("Failed to reject testimonial")
    } else {
      toast.success("Testimonial rejected")
      fetchTestimonials()
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error("Failed to delete testimonial")
    } else {
      toast.success("Testimonial deleted")
      fetchTestimonials()
    }
  }

  const roleConfig: Record<string, { label: string; color: string }> = {
    student: { label: "Student", color: "bg-primary/10 text-primary" },
    university: { label: "University", color: "bg-accent/10 text-accent" },
    company: { label: "Company", color: "bg-emerald-500/10 text-emerald-700" },
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-foreground sm:text-xl">Manage Testimonials</h1>
        <p className="text-sm text-muted-foreground">
          Review and manage user feedback and testimonials
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="mb-5 flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("approved")}
          className={`flex shrink-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-all ${
            activeTab === "approved"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Approved
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            activeTab === "approved"
              ? "bg-emerald-500/10 text-emerald-700"
              : "bg-muted text-muted-foreground"
          }`}>
            {approved.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex shrink-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-all ${
            activeTab === "pending"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Pending Approval
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
              {pending.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground text-sm">Loading testimonials...</p>
        </div>
      ) : activeTab === "approved" ? (
        <div className="flex flex-col gap-3">
          {approved.length > 0 ? (
            approved.map((testimonial) => {
              const config = roleConfig[testimonial.role] || { label: testimonial.role, color: "" }
              return (
                <Card key={testimonial.id} className="transition-colors hover:bg-secondary/30">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground overflow-hidden relative">
                            {testimonial.avatar ? (
                              <Image src={testimonial.avatar} alt={testimonial.author} fill className="object-cover" />
                            ) : (
                              testimonial.author.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{testimonial.author}</p>
                            <div className="flex items-center gap-2">
                              {testimonial.organization && (
                                <span className="text-xs text-muted-foreground">{testimonial.organization}</span>
                              )}
                              <Badge variant="secondary" className={`text-[9px] ${config.color}`}>
                                {config.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < testimonial.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-border"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="relative">
                        <Quote className="absolute -left-1 -top-1 h-5 w-5 text-muted-foreground/20" />
                        <p className="pl-5 text-sm leading-relaxed text-foreground">
                          {testimonial.content}
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-border/50 pt-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(testimonial.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(testimonial.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">No approved testimonials</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.length > 0 ? (
            pending.map((testimonial) => {
              const config = roleConfig[testimonial.role] || { label: testimonial.role, color: "" }
              return (
                <Card key={testimonial.id} className="border-amber-200/50 bg-amber-50/10">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 overflow-hidden relative">
                            {testimonial.avatar ? (
                              <Image src={testimonial.avatar} alt={testimonial.author} fill className="object-cover" />
                            ) : (
                              testimonial.author.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{testimonial.author}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className={`text-[9px] ${config.color}`}>
                                {config.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < testimonial.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-border"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="pl-5 text-sm leading-relaxed text-foreground italic">
                        &quot;{testimonial.content}&quot;
                      </p>
                      <div className="flex items-center gap-2 border-t border-border/50 pt-3">
                        <Button
                          size="sm"
                          className="h-7 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                          onClick={() => handleApprove(testimonial.id)}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => handleReject(testimonial.id)}
                        >
                          <XCircle className="h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="mb-3 h-12 w-12 text-emerald-500/30" />
                <p className="text-sm font-medium text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground">No testimonials waiting for approval</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
