import "server-only"
import { fetchApprovedTraineeSourceText } from "../trainee-import/fetch"
import type { EmployerSource } from "./catalogue"

type Rule = { allow: boolean; path: string }
// RFC 9309 longest path match, Allow wins ties, explicit agent groups precede *.
export function robotsAllows(text: string, path: string, agent = "graduatescorner") {
  const groups: { agents: string[]; rules: Rule[] }[] = []
  let group = { agents: [] as string[], rules: [] as Rule[] }
  let hasDirective = false
  for (const line of text.split(/\r?\n/)) {
    const [key, ...rest] = line.replace(/#.*$/, "").split(":")
    const value = rest.join(":").trim()
    if (key.trim().toLowerCase() === "user-agent") {
      if (hasDirective) { groups.push(group); group = { agents: [], rules: [] }; hasDirective = false }
      group.agents.push(value.toLowerCase())
    } else if (/^(allow|disallow)$/i.test(key.trim()) && group.agents.length) {
      hasDirective = true
      if (value) group.rules.push({ allow: key.trim().toLowerCase() === "allow", path: value })
    }
  }
  groups.push(group)
  const specific = groups.filter(item => item.agents.some(name => name !== "*" && agent.includes(name)))
  const chosen = specific.length ? specific : groups.filter(item => item.agents.includes("*"))
  const matched = chosen.flatMap(item => item.rules).filter(rule => {
    const expression = rule.path.split("*").map(part => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*").replace(/\\\$$/, "$")
    return new RegExp(`^${expression}`).test(path)
  }).sort((a, b) => b.path.replace(/\*/g, "").length - a.path.replace(/\*/g, "").length || Number(b.allow) - Number(a.allow))
  return matched[0]?.allow ?? true
}

export function employerFetcher(source: EmployerSource) {
  const robots = new Map<string, string>()
  let requests = 0
  const start = Date.now()
  const definition = { ...source, adapter: undefined, organization: source.name, defaultLocation: source.country, sourceUrl: source.listingUrl || source.publicUrl, platform: "html" as const, scannable: true }
  async function read(url: string, options: { method?: "GET" | "POST"; body?: string } = {}) {
    if (++requests > 36 || Date.now() - start > 65_000) throw new Error("Source scan budget reached; continue this source in the next scan")
    return fetchApprovedTraineeSourceText(definition, url, { ...options, timeoutMs: 12_000, maxBytes: 5 * 1024 * 1024, headers: { "content-type": "application/json" } })
  }
  return async (url: string, options: { method?: "GET" | "POST"; body?: string } = {}) => {
    const parsed = new URL(url)
    if (!robots.has(parsed.origin)) {
      try { robots.set(parsed.origin, (await read(`${parsed.origin}/robots.txt`)).text) }
      catch (error) {
        if (error instanceof Error && /status 40[04]/.test(error.message)) robots.set(parsed.origin, "")
        else throw new Error("Could not verify source crawler rules; scan paused")
      }
    }
    if (!robotsAllows(robots.get(parsed.origin)!, parsed.pathname + parsed.search)) throw new Error("Source crawler rules disallow this endpoint")
    const result = await read(url, options)
    // Re-check redirects before using their content; low-level fetch already enforces host/IP bounds.
    if (new URL(result.finalUrl).origin !== parsed.origin) throw new Error("Career URL moved; update the reviewed source endpoint")
    return result
  }
}
