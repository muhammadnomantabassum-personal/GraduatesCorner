export const ANALYTICS_CONSENT_KEY = "gc.analytics-consent.v1"
export const ANALYTICS_CONSENT_EVENT = "gc:open-analytics-consent"

export type AnalyticsConsent = "granted" | "denied"

export type AnalyticsEventName =
  | "apply_click"
  | "contact_admin"
  | "opportunity_view"
  | "registration_complete"
  | "registration_started"
  | "search_performed"
  | "wishlist_remove"
  | "wishlist_save"

type AnalyticsValue = string | number | boolean | null | undefined
type AnalyticsParameters = Record<string, AnalyticsValue>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    __gcGaInitialized?: boolean
    __gcAnalyticsConsent?: AnalyticsConsent
  }
}

export function readAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null
  if (window.__gcAnalyticsConsent) return window.__gcAnalyticsConsent

  try {
    const stored = window.localStorage.getItem(ANALYTICS_CONSENT_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored) as { choice?: AnalyticsConsent; savedAt?: number }
    const maxAge = 180 * 24 * 60 * 60 * 1000

    if (
      (parsed.choice !== "granted" && parsed.choice !== "denied") ||
      !parsed.savedAt ||
      Date.now() - parsed.savedAt > maxAge
    ) {
      window.localStorage.removeItem(ANALYTICS_CONSENT_KEY)
      return null
    }

    window.__gcAnalyticsConsent = parsed.choice
    return parsed.choice
  } catch {
    return null
  }
}

export function saveAnalyticsConsent(choice: AnalyticsConsent) {
  if (typeof window === "undefined") return
  window.__gcAnalyticsConsent = choice
  try {
    window.localStorage.setItem(
      ANALYTICS_CONSENT_KEY,
      JSON.stringify({ choice, savedAt: Date.now() })
    )
  } catch {
    // The in-memory choice still applies when browser storage is unavailable.
  }
}

export function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  parameters: AnalyticsParameters = {}
) {
  if (
    typeof window === "undefined" ||
    readAnalyticsConsent() !== "granted" ||
    typeof window.gtag !== "function"
  ) {
    return
  }

  const safeParameters = Object.fromEntries(
    Object.entries(parameters)
      .filter(([, value]) => value !== undefined && value !== null)
      .slice(0, 25)
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.slice(0, 100) : value,
      ])
  )

  window.gtag("event", eventName, safeParameters)
}
