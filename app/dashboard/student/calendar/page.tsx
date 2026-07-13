"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react"

type CalendarItem = {
  id: string
  title: string
  kind: "master" | "phd" | "trainee"
  organization: string
  location: string
  deadline: string
  compensation: string
  href: string
}

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export default function StudentDeadlineCalendarPage() {
  const { user, supabase } = useAuth()
  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))

  useEffect(() => {
    let active = true

    const loadWishlistDeadlines = async () => {
      if (!user || user.type !== "student") {
        setItems([])
        setLoading(false)
        return
      }

      setLoading(true)
      const { data, error } = await supabase
        .from("wishlist")
        .select(`
          thesis_id,
          program_id,
          theses (*),
          trainee_programs (*)
        `)
        .eq("user_id", user.id)

      if (!active) return

      if (error) {
        console.error("Unable to load calendar deadlines.")
        setItems([])
      } else {
        const thesisItems: CalendarItem[] = (data || [])
          .filter((item: any) => item.theses)
          .map((item: any) => ({
            id: item.theses.id,
            title: item.theses.title,
            kind: item.theses.type,
            organization: item.theses.organization,
            location: item.theses.location,
            deadline: item.theses.deadline,
            compensation: item.theses.compensation,
            href: `/theses/${item.theses.id}`,
          }))

        const programItems: CalendarItem[] = (data || [])
          .filter((item: any) => item.trainee_programs)
          .map((item: any) => ({
            id: item.trainee_programs.id,
            title: item.trainee_programs.title,
            kind: "trainee",
            organization: item.trainee_programs.company,
            location: item.trainee_programs.location,
            deadline: item.trainee_programs.deadline,
            compensation: item.trainee_programs.compensation,
            href: `/trainee-programs/${item.trainee_programs.id}`,
          }))

        setItems([...thesisItems, ...programItems])
      }

      setLoading(false)
    }

    loadWishlistDeadlines()
    return () => {
      active = false
    }
  }, [user, supabase])

  const sortedItems = useMemo(() =>
    [...items].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()),
    [items]
  )

  const upcomingSoon = sortedItems.filter((item) => {
    const days = daysUntil(item.deadline)
    return days >= 0 && days <= 14
  })

  const overdue = sortedItems.filter((item) => daysUntil(item.deadline) < 0)
  const monthCells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth])
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    items.forEach((item) => {
      const key = dateKey(new Date(item.deadline))
      map.set(key, [...(map.get(key) || []), item])
    })
    return map
  }, [items])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,#ffffff_0%,#f3f8ff_48%,#fff8e1_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-4 gap-2 bg-[#FBBC04]/15 text-[#8A5A00] hover:bg-[#FBBC04]/15">
              <CalendarDays className="h-3.5 w-3.5" />
              Deadline intelligence
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Deadline Calendar</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Track deadlines for saved PhD, thesis, and trainee opportunities in one calendar with deadline-soon alerts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/student/wishlist">
              <Button variant="outline" className="gap-2 bg-white/80">
                View wishlist
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <CalendarMetric icon={CalendarDays} label="Saved deadlines" value={items.length} tone="text-primary" />
        <CalendarMetric icon={Bell} label="Due in 14 days" value={upcomingSoon.length} tone="text-[#B06000]" />
        <CalendarMetric icon={AlertTriangle} label="Past deadlines" value={overdue.length} tone="text-destructive" />
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex min-h-[420px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-border p-4">
                <Button variant="ghost" size="icon" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))} aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <h2 className="text-lg font-bold text-foreground">
                    {visibleMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                  </h2>
                  <p className="text-xs text-muted-foreground">Saved opportunity deadlines</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))} aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
                {weekdayLabels.map((label) => (
                  <div key={label} className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground">
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {monthCells.map((day) => {
                  const dayItems = itemsByDate.get(dateKey(day)) || []
                  const isCurrentMonth = day.getMonth() === visibleMonth.getMonth()
                  const isToday = dateKey(day) === dateKey(new Date())

                  return (
                    <div
                      key={dateKey(day)}
                      className={`min-h-28 border-b border-r border-border/60 p-2 ${isCurrentMonth ? "bg-card" : "bg-secondary/20 text-muted-foreground"}`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${isToday ? "bg-primary text-primary-foreground" : ""}`}>
                          {day.getDate()}
                        </span>
                        {dayItems.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">{dayItems.length}</Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayItems.slice(0, 2).map((item) => (
                          <Link key={`${item.kind}-${item.id}`} href={item.href} className={`block truncate rounded-md px-2 py-1 text-[10px] font-semibold ${deadlineTone(item.kind)}`}>
                            {item.title}
                          </Link>
                        ))}
                        {dayItems.length > 2 && (
                          <p className="px-2 text-[10px] text-muted-foreground">+{dayItems.length - 2} more</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Deadline Soon</h2>
                    <p className="text-xs text-muted-foreground">Next 14 days</p>
                  </div>
                  <Sparkles className="h-4 w-4 text-[#FBBC04]" />
                </div>
                {upcomingSoon.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingSoon.map((item) => (
                      <DeadlineRow key={`${item.kind}-${item.id}`} item={item} urgent />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                    No saved deadlines in the next 14 days.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-foreground">Full Agenda</h2>
                  <p className="text-xs text-muted-foreground">All saved opportunity deadlines</p>
                </div>
                {sortedItems.length > 0 ? (
                  <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                    {sortedItems.map((item) => (
                      <DeadlineRow key={`${item.kind}-${item.id}`} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm font-semibold text-foreground">No saved deadlines yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">Save opportunities to your wishlist to fill the calendar.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function CalendarMetric({ icon: Icon, label, value, tone }: { icon: typeof CalendarDays; label: string; value: number; tone: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-secondary ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function DeadlineRow({ item, urgent }: { item: CalendarItem; urgent?: boolean }) {
  const days = daysUntil(item.deadline)

  return (
    <Link href={item.href} className={`block rounded-xl border p-3 transition-colors hover:bg-secondary/70 ${urgent ? "border-[#FBBC04]/35 bg-[#FBBC04]/10" : "border-border/70 bg-secondary/25"}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${deadlineTone(item.kind)}`}>
          {item.kind === "trainee" ? <Briefcase className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-semibold text-foreground">{item.title}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{days < 0 ? `${Math.abs(days)}d past` : `${days}d left`}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function buildMonthCells(month: Date) {
  const first = startOfMonth(month)
  const firstWeekday = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - firstWeekday)

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function daysUntil(deadline: string) {
  return Math.ceil((new Date(deadline).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000)
}

function deadlineTone(kind: CalendarItem["kind"]) {
  if (kind === "trainee") return "bg-[#FBBC04]/15 text-[#8A5A00]"
  if (kind === "phd") return "bg-[#34A853]/10 text-[#188038]"
  return "bg-primary/10 text-primary"
}
