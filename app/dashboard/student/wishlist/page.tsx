"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThesisCard } from "@/components/shared/thesis-card"
import { ProgramCard } from "@/components/shared/program-card"
import type { Thesis, TraineeProgram } from "@/lib/data/types"
import { Heart, Loader2 } from "lucide-react"
import Link from "next/link"

export default function StudentWishlistPage() {
  const { user, supabase } = useAuth()
  const [wishlistTheses, setWishlistTheses] = useState<Thesis[]>([])
  const [wishlistPrograms, setWishlistPrograms] = useState<TraineeProgram[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWishlistData = async () => {
      if (!user || user.type !== 'student') return

      setLoading(true)

      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          thesis_id,
          program_id,
          theses (*),
          trainee_programs (*)
        `)
        .eq('user_id', user.id)

      if (error) {
        console.error("Error fetching wishlist:", error)
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
          }))

        setWishlistTheses(theses)
        setWishlistPrograms(programs)
      }

      setLoading(false)
    }

    fetchWishlistData()
  }, [user, supabase])

  const totalWishlist = wishlistTheses.length + wishlistPrograms.length

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Wishlist</h1>
          <p className="text-sm text-muted-foreground">Your saved theses and trainee programs</p>
        </div>
        <Badge variant="outline" className="h-7 gap-1.5 px-3 font-medium">
          <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
          {totalWishlist} Items Saved
        </Badge>
      </div>

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : totalWishlist > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlistTheses.map((thesis) => (
            <ThesisCard key={thesis.id} thesis={thesis} />
          ))}
          {wishlistPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-50/50">
              <Heart className="h-10 w-10 text-red-100" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Your wishlist is empty</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              You haven't saved any opportunities yet. Browse our listings and click the heart icon to save them for later.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/master-thesis">
                <Button variant="outline">Browse Theses</Button>
              </Link>
              <Link href="/trainee-programs">
                <Button variant="outline">Browse Programs</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
