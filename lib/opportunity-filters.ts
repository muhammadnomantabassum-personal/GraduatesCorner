const DAY_MS = 86_400_000

export function getDaysUntil(deadline: string) {
  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) return 9999

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - today.getTime()) / DAY_MS)
}

export function getDeadlineBucket(deadline: string) {
  const days = getDaysUntil(deadline)
  if (days < 0) return "expired"
  if (days <= 3) return "3days"
  if (days <= 7) return "7days"
  if (days <= 30) return "30days"
  return "later"
}

export function getWorkMode(location: string) {
  const normalized = location.toLowerCase()
  if (normalized.includes("remote")) return "remote"
  if (normalized.includes("hybrid")) return "hybrid"
  return "on-site"
}

export function matchesDeadline(deadline: string, buckets: string[]) {
  if (buckets.length === 0) return true
  return buckets.includes(getDeadlineBucket(deadline))
}

export function matchesWorkMode(location: string, modes: string[]) {
  if (modes.length === 0) return true
  return modes.includes(getWorkMode(location))
}
