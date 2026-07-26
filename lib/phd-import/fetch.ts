import "server-only"

import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import type { PhdImportSourceDefinition } from "./types"

const DEFAULT_MAX_BYTES = 2 * 1024 * 1024
const DEFAULT_TIMEOUT_MS = 20_000
const MAX_REDIRECTS = 3

function isPrivateIpv4(address: string) {
  const octets = address.split(".").map(Number)
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
    return true
  }

  const [a, b, c] = octets
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  )
}

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "")

  if (isIP(normalized) === 4) return isPrivateIpv4(normalized)
  if (isIP(normalized) !== 6) return true

  if (normalized.startsWith("::ffff:")) {
    return isPrivateIpv4(normalized.slice(7))
  }

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  )
}

async function assertAllowedPublicUrl(source: PhdImportSourceDefinition, value: string) {
  const url = new URL(value)

  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Source URL must be a public HTTPS address")
  }

  if (url.port && url.port !== "443") {
    throw new Error("Source URL uses a blocked port")
  }

  const hostname = url.hostname.toLowerCase()
  if (!source.allowedHosts.some((allowedHost) => hostname === allowedHost || hostname.endsWith(`.${allowedHost}`))) {
    throw new Error(`Source redirected to an unapproved host: ${hostname}`)
  }

  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error("Private source addresses are blocked")
    return url
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true })
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Source hostname does not resolve to a public address")
  }

  return url
}

async function readLimitedText(response: Response, maxBytes: number) {
  const declaredLength = Number(response.headers.get("content-length") || 0)
  if (declaredLength > maxBytes) throw new Error("Source response is too large")
  if (!response.body) return ""

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > maxBytes) {
      await reader.cancel()
      throw new Error("Source response is too large")
    }
    chunks.push(value)
  }

  const combined = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.byteLength
  }

  return new TextDecoder().decode(combined)
}

export async function fetchApprovedSourceText(
  source: PhdImportSourceDefinition,
  value: string,
  options: { maxBytes?: number; timeoutMs?: number } = {}
) {
  let currentUrl = await assertAllowedPublicUrl(source, value)
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      headers: {
        accept: "text/html, application/xhtml+xml, application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.5",
        "user-agent": "GraduatesCorner opportunity importer (+https://graduatescorner.com)",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      cache: "no-store",
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      if (!location || redirectCount === MAX_REDIRECTS) {
        throw new Error("Source redirected too many times")
      }
      currentUrl = await assertAllowedPublicUrl(source, new URL(location, currentUrl).toString())
      continue
    }

    if (!response.ok) {
      throw new Error(`Source request failed with status ${response.status}`)
    }

    return {
      text: await readLimitedText(response, maxBytes),
      finalUrl: currentUrl.toString(),
      contentType: response.headers.get("content-type") || "",
    }
  }

  throw new Error("Unable to fetch source")
}
