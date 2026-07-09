"use client"

import dynamic from "next/dynamic"

const Assistant = dynamic(
  () => import("@/components/shared/opportunity-assistant").then((mod) => mod.OpportunityAssistant),
  {
    ssr: false,
    loading: () => null,
  }
)

export function LazyOpportunityAssistant({
  surface = "public",
}: {
  surface?: "public" | "dashboard" | "admin"
}) {
  return <Assistant surface={surface} />
}
