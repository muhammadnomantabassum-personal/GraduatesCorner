"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import type { Testimonial } from "@/lib/data/types"
import {
  Star,
  MessageSquare,
  PenLine,
  CheckCircle2,
  Clock,
  Info,
  Quote,
  Send,
  X,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

export default function CompanyTestimonialsPage() {
  const { user } = useAuth()
  const [localTestimonials, setLocalTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState("")
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  const fetchMyTestimonials = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error("Failed to fetch feedback")
    } else {
      setLocalTestimonials(data.map((t: any) => ({
        id: t.id,
        author: t.author,
        role: t.role,
        organization: t.organization,
        content: t.content,
        rating: t.rating,
        status: t.status,
        createdAt: t.created_at,
        userId: t.user_id,
      })))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMyTestimonials()
  }, [user, supabase])

  const approvedTestimonial = localTestimonials.find((t) => t.status === "approved")
  const pendingTestimonial = localTestimonials.find((t) => t.status === "pending")
  const hasAnyTestimonial = localTestimonials.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!content.trim()) {
      toast.error("Please write your feedback")
      return
    }

    setIsSubmitting(true)

    const testimonialData = {
      author: user.organization || user.name,
      role: user.type,
      organization: user.organization || null,
      content: content.trim(),
      rating,
      status: "pending",
      user_id: user.type === 'admin' ? null : user.id,
    }

    let error;
    if (isEditing && pendingTestimonial) {
      const { error: updateError } = await supabase
        .from('testimonials')
        .update(testimonialData)
        .eq('id', pendingTestimonial.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('testimonials')
        .insert(testimonialData)
      error = insertError
    }

    setIsSubmitting(false)

    if (error) {
      toast.error("Failed to submit feedback: " + error.message)
    } else {
      toast.success(
        isEditing
          ? "Updated feedback submitted for review!"
          : "Feedback submitted for review!",
        { description: "It will appear publicly once reviewed by an admin." }
      )
      setContent("")
      setRating(5)
      setShowForm(false)
      setIsEditing(false)
      fetchMyTestimonials()
    }
  }

  const handleEditApproved = () => {
    if (approvedTestimonial) {
      setContent(approvedTestimonial.content)
      setRating(approvedTestimonial.rating)
      setIsEditing(false)
      setShowForm(true)
    }
  }

  const handleEditPending = () => {
    if (pendingTestimonial) {
      setContent(pendingTestimonial.content)
      setRating(pendingTestimonial.rating)
      setIsEditing(true)
      setShowForm(true)
    }
  }

  const canWriteNew = !pendingTestimonial && !approvedTestimonial
  const canEditApproved = approvedTestimonial && !pendingTestimonial

  if (loading && !hasAnyTestimonial) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Feedback</h1>
          <p className="text-sm text-muted-foreground">
            Share your experience with GraduatesCorner
          </p>
        </div>
        {(canWriteNew || canEditApproved) && !showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-1.5">
            <PenLine className="h-4 w-4" />
            {approvedTestimonial ? "Update Feedback" : "Write Feedback"}
          </Button>
        )}
      </div>

      {/* Info Banner */}
      {!hasAnyTestimonial && !showForm && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">How feedback works</p>
            <p className="mt-1">
              You can submit feedback about your experience with GraduatesCorner.
              After admin approval, it will be shown publicly on the website.
              If you submit an update, it will go through review while your previous 
              approved feedback remains visible (if any).
            </p>
          </div>
        </div>
      )}

      {/* Write / Edit Form */}
      {showForm && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {isEditing
                  ? "Edit Pending Feedback"
                  : approvedTestimonial
                    ? "Update Your Feedback"
                    : "Write Your Feedback"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground"
                onClick={() => {
                  setShowForm(false)
                  setIsEditing(false)
                  setContent("")
                  setRating(5)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium">Rating</Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5"
                    >
                      <Star
                        className={`h-5 w-5 transition-colors ${
                          star <= (hoverRating || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-border"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground">{rating}/5</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="content" className="text-xs font-medium">
                  Your Feedback
                </Label>
                <Textarea
                  id="content"
                  placeholder="Tell us about your experience with GraduatesCorner..."
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  maxLength={600}
                />
                <span className="text-right text-[10px] text-muted-foreground">
                  {content.length}/600
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting} className="gap-1.5">
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {isEditing ? "Update & Resubmit" : "Submit for Review"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setIsEditing(false)
                    setContent("")
                    setRating(5)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending / Waiting Section */}
      {pendingTestimonial && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-foreground">Waiting for Approval</h2>
          </div>
          <Card className="border-amber-200/50 bg-amber-50/20 dark:border-amber-900/30 dark:bg-amber-950/20">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < pendingTestimonial.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-border"
                      }`}
                    />
                  ))}
                </div>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  Under review
                </span>
              </div>
              <div className="relative">
                <Quote className="absolute -left-1 -top-1 h-6 w-6 text-amber-400/40" />
                <p className="pl-6 text-sm leading-relaxed text-foreground">
                  {pendingTestimonial.content}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Submitted{" "}
                  {new Date(pendingTestimonial.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleEditPending}
                >
                  <PenLine className="h-3 w-3" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Approved Section */}
      {approvedTestimonial && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-foreground">Approved</h2>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              Visible on website
            </span>
          </div>
          <Card className="border-emerald-200/50 bg-emerald-50/20 dark:border-emerald-900/20 dark:bg-emerald-950/10">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < approvedTestimonial.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-border"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="relative">
                <Quote className="absolute -left-1 -top-1 h-6 w-6 text-amber-400/40" />
                <p className="pl-6 text-sm leading-relaxed text-foreground">
                  {approvedTestimonial.content}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Submitted{" "}
                  {new Date(approvedTestimonial.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {canEditApproved && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleEditApproved}
                  >
                    <PenLine className="h-3 w-3" />
                    Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!hasAnyTestimonial && !showForm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-1 text-base font-semibold text-foreground">No feedback yet</h3>
            <p className="mb-5 max-w-sm text-sm text-muted-foreground">
              Share your experience with GraduatesCorner to help other companies
              discover the platform
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-1.5">
              <PenLine className="h-4 w-4" />
              Write Your Feedback
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
