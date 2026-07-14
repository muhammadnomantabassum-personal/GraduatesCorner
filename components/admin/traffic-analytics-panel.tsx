"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  BarChart3,
  Download,
  Eye,
  Gauge,
  Globe2,
  Loader2,
  MonitorSmartphone,
  MousePointerClick,
  RefreshCw,
  Route,
  Users,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type {
  TrafficAnalyticsData,
  TrafficAnalyticsResponse,
  TrafficDimensionRow,
} from "@/lib/traffic-analytics-types"

const palette = ["#4285f4", "#34a853", "#fbbc05", "#ea4335", "#8b5cf6"]
const ranges = [7, 30, 90] as const

export function TrafficAnalyticsPanel() {
  const [days, setDays] = useState<(typeof ranges)[number]>(30)
  const [refreshKey, setRefreshKey] = useState(0)
  const [data, setData] = useState<TrafficAnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/traffic-analytics?days=${days}`, {
          signal: controller.signal,
          cache: "no-store",
        })
        const result = await response.json().catch(() => ({})) as TrafficAnalyticsResponse & { error?: string }

        if (!response.ok) throw new Error(result.error || "Traffic analytics could not be loaded.")
        setData(result)
      } catch (loadError) {
        if (controller.signal.aborted) return
        setError(loadError instanceof Error ? loadError.message : "Traffic analytics could not be loaded.")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [days, refreshKey])

  const analytics = data?.configured ? data : null
  const chartData = useMemo(
    () => analytics?.trend.map((item) => ({ ...item, label: formatAnalyticsDate(item.date) })) || [],
    [analytics]
  )

  return (
    <section id="traffic-analytics" className="scroll-mt-24 space-y-5" aria-labelledby="traffic-analytics-title">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-primary">
            <BarChart3 className="h-4 w-4" />
            Audience intelligence
          </div>
          <h2 id="traffic-analytics-title" className="text-2xl font-bold text-foreground">
            Website traffic
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Privacy-aware acquisition, engagement, geography, and conversion signals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex h-9 items-center rounded-md border border-border bg-card p-1" aria-label="Analytics date range">
            {ranges.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDays(range)}
                aria-pressed={days === range}
                className={`h-7 min-w-12 rounded px-2 text-xs font-semibold transition-colors ${
                  days === range ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {range}d
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            title="Refresh traffic analytics"
            aria-label="Refresh traffic analytics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => analytics && exportTrafficCsv(analytics)}
            disabled={!analytics}
            title="Export traffic summary"
            aria-label="Export traffic summary"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? <TrafficLoadingState /> : null}

      {!loading && error ? (
        <div className="border border-destructive/25 bg-destructive/5 p-5 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!loading && data && !data.configured ? (
        <div className="flex items-start gap-4 border border-[#fbbc05]/40 bg-[#fbbc05]/10 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#fbbc05]/20 text-[#8a6100]">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Google Analytics connection pending</p>
            <p className="mt-1 text-sm text-muted-foreground">{data.message}</p>
          </div>
        </div>
      ) : null}

      {!loading && analytics ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <TrafficMetric
              label="Active users"
              value={analytics.summary.activeUsers}
              helper={`${formatNumber(analytics.summary.newUsers)} new users`}
              icon={Users}
              color={palette[0]}
            />
            <TrafficMetric
              label="Page views"
              value={analytics.summary.pageViews}
              helper={`${formatNumber(analytics.summary.sessions)} sessions`}
              icon={Eye}
              color={palette[1]}
            />
            <TrafficMetric
              label="Engagement rate"
              value={`${analytics.summary.engagementRate}%`}
              helper={`${formatNumber(analytics.summary.engagedSessions)} engaged sessions`}
              icon={MousePointerClick}
              color={palette[2]}
            />
            <TrafficMetric
              label="Live now"
              value={analytics.realtimeUsers}
              helper="Active in the last 30 minutes"
              icon={Activity}
              color={palette[3]}
              live
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
            <AnalyticsCard title="Audience trend" subtitle={`Daily activity across the last ${days} days`} icon={Route}>
              <ResponsiveContainer width="100%" height={310}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="trafficUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette[0]} stopOpacity={0.32} />
                      <stop offset="95%" stopColor={palette[0]} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="trafficViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette[1]} stopOpacity={0.24} />
                      <stop offset="95%" stopColor={palette[1]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={28} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} width={32} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid #e2e8f0" }} />
                  <Area type="monotone" dataKey="pageViews" name="Page views" stroke={palette[1]} fill="url(#trafficViews)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="users" name="Users" stroke={palette[0]} fill="url(#trafficUsers)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </AnalyticsCard>

            <AnalyticsCard title="Device mix" subtitle="Active users by device" icon={MonitorSmartphone}>
              {analytics.devices.length ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={analytics.devices} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>
                        {analytics.devices.map((item, index) => (
                          <Cell key={item.name} fill={palette[index % palette.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid #e2e8f0" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid gap-2">
                    {analytics.devices.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 capitalize text-muted-foreground">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: palette[index % palette.length] }} />
                          {item.name}
                        </span>
                        <span className="font-semibold text-foreground">{formatNumber(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyMetric />}
            </AnalyticsCard>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <RankedList title="Top countries" subtitle="Active users by location" icon={Globe2} rows={analytics.countries} />
            <RankedList title="Acquisition channels" subtitle="How visitors arrive" icon={Route} rows={analytics.sources} />
            <EventList rows={analytics.events} />
          </div>

          <AnalyticsCard title="Top content" subtitle="Most viewed public pages" icon={Eye}>
            {analytics.topPages.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                      <th className="pb-3 font-semibold">Page</th>
                      <th className="pb-3 text-right font-semibold">Views</th>
                      <th className="pb-3 text-right font-semibold">Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topPages.map((page) => (
                      <tr key={`${page.detail}-${page.name}`} className="border-b border-border/70 last:border-0">
                        <td className="max-w-0 py-3 pr-4">
                          <p className="truncate font-medium text-foreground">{page.name}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{page.detail}</p>
                        </td>
                        <td className="py-3 text-right font-semibold text-foreground">{formatNumber(page.value)}</td>
                        <td className="py-3 text-right text-muted-foreground">{formatNumber(page.secondaryValue || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyMetric />}
          </AnalyticsCard>

          <p className="text-right text-xs text-muted-foreground">
            Last synchronized {new Date(analytics.generatedAt).toLocaleString("en-GB")}
          </p>
        </>
      ) : null}
    </section>
  )
}
function TrafficMetric({
  label,
  value,
  helper,
  icon: Icon,
  color,
  live = false,
}: {
  label: string
  value: number | string
  helper: string
  icon: typeof Users
  color: string
  live?: boolean
}) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{typeof value === "number" ? formatNumber(value) : value}</p>
          </div>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg" style={{ color, backgroundColor: `${color}16` }}>
            <Icon className="h-5 w-5" />
            {live ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-[#34a853]" /> : null}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  )
}

function AnalyticsCard({ title, subtitle, icon: Icon, children }: {
  title: string
  subtitle: string
  icon: typeof Users
  children: React.ReactNode
}) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function RankedList({ title, subtitle, icon, rows }: {
  title: string
  subtitle: string
  icon: typeof Users
  rows: TrafficDimensionRow[]
}) {
  const maximum = Math.max(1, ...rows.map((row) => row.value))

  return (
    <AnalyticsCard title={title} subtitle={subtitle} icon={icon}>
      {rows.length ? (
        <div className="grid gap-3">
          {rows.slice(0, 7).map((row, index) => (
            <div key={row.name}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-muted-foreground">{row.name}</span>
                <span className="font-semibold text-foreground">{formatNumber(row.value)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(4, (row.value / maximum) * 100)}%`, backgroundColor: palette[index % palette.length] }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyMetric />}
    </AnalyticsCard>
  )
}

function EventList({ rows }: { rows: TrafficAnalyticsData["events"] }) {
  return (
    <AnalyticsCard title="Conversion signals" subtitle="Tracked platform actions" icon={MousePointerClick}>
      {rows.length ? (
        <div className="grid gap-2">
          {rows.map((row) => (
            <div key={row.name} className="flex items-center justify-between border-b border-border/70 py-2.5 last:border-0">
              <span className="text-sm text-muted-foreground">{formatEventName(row.name)}</span>
              <span className="font-semibold text-foreground">{formatNumber(row.count)}</span>
            </div>
          ))}
        </div>
      ) : <EmptyMetric />}
    </AnalyticsCard>
  )
}

function TrafficLoadingState() {
  return (
    <div className="flex min-h-52 items-center justify-center border border-border bg-card text-primary">
      <div className="text-center">
        <Loader2 className="mx-auto h-7 w-7 animate-spin" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">Loading traffic intelligence...</p>
      </div>
    </div>
  )
}

function EmptyMetric() {
  return <p className="py-8 text-center text-sm text-muted-foreground">No data in this period.</p>
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: value >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value)
}

function formatAnalyticsDate(value: string) {
  if (!/^\d{8}$/.test(value)) return value
  const date = new Date(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8)))
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function formatEventName(value: string) {
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
}

function exportTrafficCsv(data: TrafficAnalyticsData) {
  const rows = [
    ["metric", "value"],
    ["active_users", data.summary.activeUsers],
    ["new_users", data.summary.newUsers],
    ["sessions", data.summary.sessions],
    ["page_views", data.summary.pageViews],
    ["engagement_rate", data.summary.engagementRate],
    ...data.events.map((event) => [`event_${event.name}`, event.count]),
  ]
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = `graduates-corner-traffic-${data.days}d.csv`
  link.click()
  URL.revokeObjectURL(url)
}
