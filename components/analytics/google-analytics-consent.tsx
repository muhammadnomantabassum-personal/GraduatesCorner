"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, ShieldCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ANALYTICS_CONSENT_EVENT,
  readAnalyticsConsent,
  saveAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics"

const deniedConsent = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
}

function installGoogleAnalytics(measurementId: string) {
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag() {
    window.dataLayer?.push(arguments)
  }

  window.gtag("consent", "default", deniedConsent)
  window.gtag("consent", "update", {
    ...deniedConsent,
    analytics_storage: "granted",
  })

  if (!window.__gcGaInitialized) {
    window.__gcGaInitialized = true
    window.gtag("js", new Date())
    window.gtag("config", measurementId, {
      send_page_view: false,
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    })
  }

  if (!document.getElementById("gc-google-analytics")) {
    const script = document.createElement("script")
    script.id = "gc-google-analytics"
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
    document.head.appendChild(script)
  }
}

function disableGoogleAnalytics() {
  window.gtag?.("consent", "update", deniedConsent)

  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim()
    if (!name?.startsWith("_ga")) return

    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.graduatescorner.com; SameSite=Lax`
  })
}

export function GoogleAnalyticsConsent() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()
  const pathname = usePathname()
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null)
  const [ready, setReady] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  useEffect(() => {
    if (!measurementId) return
    const storedConsent = readAnalyticsConsent()
    setConsent(storedConsent)
    setPreferencesOpen(storedConsent === null)
    setReady(true)
  }, [measurementId])

  useEffect(() => {
    const openPreferences = () => setPreferencesOpen(true)
    window.addEventListener(ANALYTICS_CONSENT_EVENT, openPreferences)
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, openPreferences)
  }, [])

  useEffect(() => {
    if (!measurementId || consent !== "granted") return
    installGoogleAnalytics(measurementId)
  }, [consent, measurementId])

  useEffect(() => {
    if (!measurementId || consent !== "granted" || typeof window.gtag !== "function") return
    if (pathname.startsWith("/n_admin") || pathname.startsWith("/dashboard")) return

    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: `${window.location.origin}${pathname}`,
      page_path: pathname,
    })

    const opportunity = getOpportunityFromPath(pathname)
    if (opportunity) {
      window.gtag("event", "opportunity_view", opportunity)
    }
  }, [consent, measurementId, pathname])

  if (!measurementId || !ready || !preferencesOpen) return null

  const choose = (choice: AnalyticsConsent) => {
    saveAnalyticsConsent(choice)
    setConsent(choice)
    setPreferencesOpen(false)
    if (choice === "denied") disableGoogleAnalytics()
  }

  return (
    <div
      role="dialog"
      aria-label="Analytics preferences"
      aria-describedby="analytics-consent-description"
      className="fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-3xl border border-border bg-card p-4 shadow-[0_20px_70px_rgba(15,23,42,0.22)] sm:bottom-5 sm:flex sm:items-center sm:gap-5 sm:p-5"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Your analytics choice</h2>
            <BarChart3 className="h-4 w-4 text-[#34a853]" />
          </div>
          <p id="analytics-consent-description" className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Optional analytics helps us improve opportunity discovery. Necessary services remain active either way, and advertising storage stays disabled.
            {" "}
            <Link href="/privacy-policy" className="font-medium text-primary hover:underline">
              Privacy policy
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-4 flex shrink-0 items-center gap-2 sm:mt-0">
        <Button variant="outline" size="sm" onClick={() => choose("denied")}>
          Reject optional
        </Button>
        <Button size="sm" onClick={() => choose("granted")}>
          Accept analytics
        </Button>
        {consent !== null ? (
          <button
            type="button"
            onClick={() => setPreferencesOpen(false)}
            aria-label="Close analytics preferences"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

function getOpportunityFromPath(pathname: string) {
  const patterns = [
    { expression: /^\/phd-positions\/([^/]+)$/, opportunityType: "phd" },
    { expression: /^\/theses\/([^/]+)$/, opportunityType: "master_thesis" },
    { expression: /^\/trainee-programs\/([^/]+)$/, opportunityType: "trainee_program" },
  ]

  for (const pattern of patterns) {
    const match = pathname.match(pattern.expression)
    if (match?.[1]) {
      return {
        item_id: match[1],
        opportunity_type: pattern.opportunityType,
      }
    }
  }

  return null
}
