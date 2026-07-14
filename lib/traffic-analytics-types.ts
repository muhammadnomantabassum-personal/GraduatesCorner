export type TrafficSummary = {
  activeUsers: number
  newUsers: number
  sessions: number
  pageViews: number
  engagedSessions: number
  engagementRate: number
}
export type TrafficTrendPoint = {
  date: string
  users: number
  pageViews: number
  sessions: number
}

export type TrafficDimensionRow = {
  name: string
  value: number
  secondaryValue?: number
  detail?: string
}

export type TrafficEventRow = {
  name: string
  count: number
}

export type TrafficAnalyticsData = {
  configured: true
  days: number
  generatedAt: string
  realtimeUsers: number
  summary: TrafficSummary
  trend: TrafficTrendPoint[]
  countries: TrafficDimensionRow[]
  topPages: TrafficDimensionRow[]
  sources: TrafficDimensionRow[]
  devices: TrafficDimensionRow[]
  events: TrafficEventRow[]
}

export type TrafficAnalyticsUnavailable = {
  configured: false
  message: string
}

export type TrafficAnalyticsResponse = TrafficAnalyticsData | TrafficAnalyticsUnavailable
