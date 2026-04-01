"use client"

import { useState, useEffect, useMemo } from "react"
import { PublicLayout } from "@/components/layout/public-layout"
import { TestimonialCard } from "@/components/shared/testimonial-card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import type { Testimonial } from "@/lib/data/types"
import Link from "next/link"
import { GraduationCap, Loader2 } from "lucide-react"

const roles = ["all", "student", "university", "company"] as const

export default function TestimonialsPage() {
  const { supabase } = useAuth()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<(typeof roles)[number]>("all")

  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching testimonials:', error)
      } else {
        const formattedData = data.map((t: any) => ({
          id: t.id,
          author: t.author,
          role: t.role,
          organization: t.organization,
          content: t.content,
          rating: t.rating,
          status: t.status,
          createdAt: t.created_at,
          userId: t.user_id,
        }))
        setTestimonials(formattedData)
      }
      setLoading(false)
    }

    fetchTestimonials()
  }, [supabase])

  const filtered = useMemo(() => {
    return roleFilter === "all" 
      ? testimonials 
      : testimonials.filter((t) => t.role === roleFilter)
  }, [testimonials, roleFilter])

  return (
    <PublicLayout>
      <section className="border-b border-border bg-primary px-4 py-12 text-primary-foreground lg:py-16">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-3 text-3xl font-bold lg:text-4xl">Testimonials</h1>
          <p className="text-lg text-primary-foreground/80">
            Hear from students, universities, and companies who use GradNexus
          </p>
        </div>
      </section>

      <section className="px-4 py-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap gap-2">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  roleFilter === role
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                }`}
              >
                {role === "all" ? "All" : `${role}s`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading testimonials...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 rounded-xl border border-border bg-secondary/50 p-8 text-center">
            <GraduationCap className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="mb-2 text-xl font-semibold text-foreground">Share Your Experience</h2>
            <p className="mb-6 text-muted-foreground">
              Have you used GradNexus? Log in to share your story with the community.
            </p>
            <Link href="/login">
              <Button>Log In to Submit a Testimonial</Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
