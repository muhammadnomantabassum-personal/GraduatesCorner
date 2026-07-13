import "server-only"

import { NextResponse } from "next/server"

type ErrorMetadata = {
  name?: string
  code?: string
  status?: number
}

function safeToken(value: unknown) {
  if (typeof value !== "string") return undefined
  return /^[a-z0-9_.-]{1,64}$/i.test(value) ? value : undefined
}

function getSafeErrorMetadata(error: unknown): ErrorMetadata {
  if (!error || typeof error !== "object") return {}

  const candidate = error as Record<string, unknown>
  const status = typeof candidate.status === "number" && Number.isInteger(candidate.status)
    ? candidate.status
    : undefined

  return {
    name: safeToken(candidate.name),
    code: safeToken(candidate.code),
    status,
  }
}

export function reportServerError(context: string, error: unknown) {
  const metadata = getSafeErrorMetadata(error)
  console.error(`[server] ${context} failed`, metadata)
}

export function internalErrorResponse(
  context: string,
  error: unknown,
  publicMessage = "The request could not be completed."
) {
  reportServerError(context, error)
  return NextResponse.json(
    { error: publicMessage },
    {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    }
  )
}
