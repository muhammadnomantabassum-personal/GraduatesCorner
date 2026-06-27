import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Testimonial } from "@/lib/data/types"

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  // Generate initials from author name
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <Card className="flex flex-col border-border/70 bg-card/92 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_22px_55px_rgba(66,133,244,0.14)]">
      <CardContent className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < testimonial.rating ? "fill-amber-400 text-amber-400" : "text-border"}`}
            />
          ))}
        </div>
        <blockquote className="flex-1 text-sm leading-relaxed text-foreground">
          &ldquo;{testimonial.content}&rdquo;
        </blockquote>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-border/50">
              {testimonial.avatar && <AvatarImage src={testimonial.avatar} alt={testimonial.author} className="object-cover" />}
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(testimonial.author)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{testimonial.author}</p>
              {testimonial.organization && (
                <p className="text-xs text-muted-foreground">{testimonial.organization}</p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="text-xs capitalize">
            {testimonial.role}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
