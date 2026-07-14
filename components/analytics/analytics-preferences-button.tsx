"use client"

import { ANALYTICS_CONSENT_EVENT } from "@/lib/analytics"

export function AnalyticsPreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT))}
      className="text-left text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-primary"
    >
      Analytics preferences
    </button>
  )
}
