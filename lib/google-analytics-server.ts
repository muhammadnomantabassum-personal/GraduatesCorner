import "server-only"

import crypto from "node:crypto"
import type {
  TrafficAnalyticsData,
  TrafficDimensionRow,
  TrafficEventRow,
  TrafficTrendPoint,
} from "@/lib/traffic-analytics-types"

const ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly"
const TOKEN_AUDIENCE = "https://oauth2.googleapis.com/token"
const CACHE_TTL_MS = 5 * 60 * 1000
const trackedEvents = [
  "opportunity_view",
  "apply_click",
  "wishlist_save",
  "registration_complete",
  "contact_admin",
  "search_performed",
]

type GoogleAnalyticsConfig = {
  propertyId: string
  clientEmail: string
  privateKey: string
}
type AnalyticsRow = {
  dimensionValues?: Array<{ value?: string }>
  metricValues?: Array<{ value?: string }>
}

type AnalyticsReport = {
  rows?: AnalyticsRow[]
  totals?: AnalyticsRow[]
}

type BatchReportResponse = {
  reports?: AnalyticsReport[]
}

type RealtimeReportResponse = {
  rows?: AnalyticsRow[]
}

let tokenCache: { token: string; expiresAt: number } | null = null
const reportCache = new Map<number, { data: TrafficAnalyticsData; expiresAt: number }>()

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url")
}

function getConfig(): GoogleAnalyticsConfig | null {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim()
  const clientEmail = process.env.GA4_CLIENT_EMAIL?.trim()
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n").trim()

  if (
    !propertyId ||
    !/^\d{4,20}$/.test(propertyId) ||
    !clientEmail ||
    !clientEmail.includes("@") ||
    !privateKey ||
    !privateKey.includes("BEGIN PRIVATE KEY")
  ) {
    return null
  }

  return { propertyId, clientEmail, privateKey }
}

export function isGoogleAnalyticsConfigured() {
  return getConfig() !== null
}

async function getAccessToken(config: GoogleAnalyticsConfig) {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token
  }

  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const claims = base64Url(JSON.stringify({
    iss: config.clientEmail,
    scope: ANALYTICS_SCOPE,
    aud: TOKEN_AUDIENCE,
    iat: now,
    exp: now + 3600,
  }))
  const unsignedToken = `${header}.${claims}`
  const signer = crypto.createSign("RSA-SHA256")
  signer.update(unsignedToken)
  signer.end()
  const assertion = `${unsignedToken}.${signer.sign(config.privateKey).toString("base64url")}`

  const response = await fetch(TOKEN_AUDIENCE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw Object.assign(new Error("Google Analytics authentication failed."), {
      code: "GA_AUTH_FAILED",
      status: response.status,
    })
  }

  const result = await response.json() as { access_token?: string; expires_in?: number }
  if (!result.access_token) {
    throw Object.assign(new Error("Google Analytics returned no access token."), {
      code: "GA_TOKEN_MISSING",
    })
  }

  tokenCache = {
    token: result.access_token,
    expiresAt: Date.now() + Math.max(300, result.expires_in || 3600) * 1000,
  }
  return result.access_token
}

async function requestReport<T>(
  config: GoogleAnalyticsConfig,
  accessToken: string,
  method: "batchRunReports" | "runReport" | "runRealtimeReport",
  body: Record<string, unknown>
) {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${config.propertyId}:${method}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw Object.assign(new Error("Google Analytics report request failed."), {
      code: "GA_REPORT_FAILED",
      status: response.status,
    })
  }

  return response.json() as Promise<T>
}

function numberValue(row: AnalyticsRow | undefined, metricIndex: number) {
  const value = Number(row?.metricValues?.[metricIndex]?.value || 0)
  return Number.isFinite(value) ? value : 0
}

function dimensionValue(row: AnalyticsRow, dimensionIndex = 0) {
  return row.dimensionValues?.[dimensionIndex]?.value?.trim() || "Unknown"
}

function mapDimensionRows(report: AnalyticsReport | undefined, limit = 10): TrafficDimensionRow[] {
  return (report?.rows || []).slice(0, limit).map((row) => ({
    name: dimensionValue(row),
    value: numberValue(row, 0),
    secondaryValue: numberValue(row, 1),
  }))
}

function mapPageRows(report: AnalyticsReport | undefined): TrafficDimensionRow[] {
  return (report?.rows || []).slice(0, 10).map((row) => ({
    name: dimensionValue(row, 1) === "Unknown" ? dimensionValue(row, 0) : dimensionValue(row, 1),
    detail: dimensionValue(row, 0),
    value: numberValue(row, 0),
    secondaryValue: numberValue(row, 1),
  }))
}

function mapEvents(report: AnalyticsReport | undefined): TrafficEventRow[] {
  return (report?.rows || []).map((row) => ({
    name: dimensionValue(row),
    count: numberValue(row, 0),
  }))
}

export async function getTrafficAnalytics(days: number): Promise<TrafficAnalyticsData> {
  const cached = reportCache.get(days)
  if (cached && cached.expiresAt > Date.now()) return cached.data

  const config = getConfig()
  if (!config) {
    throw Object.assign(new Error("Google Analytics is not configured."), {
      code: "GA_NOT_CONFIGURED",
    })
  }

  const accessToken = await getAccessToken(config)
  const dateRanges = [{ startDate: `${Math.max(1, days - 1)}daysAgo`, endDate: "today" }]

  const [batch, eventsResult, realtimeResult] = await Promise.all([
    requestReport<BatchReportResponse>(config, accessToken, "batchRunReports", {
      requests: [
        {
          dateRanges,
          dimensions: [{ name: "date" }],
          metrics: [
            { name: "activeUsers" },
            { name: "newUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
            { name: "engagedSessions" },
          ],
          metricAggregations: ["TOTAL"],
          orderBys: [{ dimension: { dimensionName: "date" } }],
          keepEmptyRows: true,
        },
        {
          dateRanges,
          dimensions: [{ name: "country" }],
          metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
          orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
          limit: 10,
        },
        {
          dateRanges,
          dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
          metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 10,
        },
        {
          dateRanges,
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          metrics: [{ name: "activeUsers" }, { name: "sessions" }],
          orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
          limit: 10,
        },
        {
          dateRanges,
          dimensions: [{ name: "deviceCategory" }],
          metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
          orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
          limit: 5,
        },
      ],
    }),
    requestReport<AnalyticsReport>(config, accessToken, "runReport", {
      dateRanges,
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: { values: trackedEvents },
        },
      },
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: trackedEvents.length,
    }).catch(() => ({ rows: [] })),
    requestReport<RealtimeReportResponse>(config, accessToken, "runRealtimeReport", {
      metrics: [{ name: "activeUsers" }],
    }).catch(() => ({ rows: [] })),
  ])

  const reports = batch.reports || []
  const trendReport = reports[0]
  const totals = trendReport?.totals?.[0]
  const sessions = numberValue(totals, 2)
  const engagedSessions = numberValue(totals, 4)
  const trend: TrafficTrendPoint[] = (trendReport?.rows || []).map((row) => ({
    date: dimensionValue(row),
    users: numberValue(row, 0),
    sessions: numberValue(row, 2),
    pageViews: numberValue(row, 3),
  }))

  const data: TrafficAnalyticsData = {
    configured: true,
    days,
    generatedAt: new Date().toISOString(),
    realtimeUsers: numberValue(realtimeResult.rows?.[0], 0),
    summary: {
      activeUsers: numberValue(totals, 0),
      newUsers: numberValue(totals, 1),
      sessions,
      pageViews: numberValue(totals, 3),
      engagedSessions,
      engagementRate: sessions > 0 ? Math.round((engagedSessions / sessions) * 1000) / 10 : 0,
    },
    trend,
    countries: mapDimensionRows(reports[1]),
    topPages: mapPageRows(reports[2]),
    sources: mapDimensionRows(reports[3]),
    devices: mapDimensionRows(reports[4], 5),
    events: mapEvents(eventsResult),
  }

  reportCache.set(days, { data, expiresAt: Date.now() + CACHE_TTL_MS })
  return data
}
