import type { Thesis, TraineeProgram } from "@/lib/data/types"

export type OpportunitySignalTone = "blue" | "green" | "yellow" | "red" | "neutral"

export interface OpportunitySignal {
  label: string
  tone: OpportunitySignalTone
}

export interface OpportunityIntelligence {
  score: number
  label: string
  deadlineLabel: string
  deadlineTone: string
  signals: OpportunitySignal[]
}

const DAY_MS = 86_400_000

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function daysUntil(deadline: string) {
  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) return 999

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - today.getTime()) / DAY_MS)
}

function isFunded(compensation: string) {
  return compensation === "paid" || compensation === "stipend"
}

function isVerified(item: Pick<Thesis, "organizationVerified" | "postedBy"> | Pick<TraineeProgram, "organizationVerified" | "postedBy">) {
  return Boolean(item.organizationVerified) || item.postedBy === "admin"
}

function deadlineSignal(deadline: string) {
  const days = daysUntil(deadline)

  if (days < 0) {
    return {
      days,
      label: "Closed",
      tone: "bg-muted text-muted-foreground",
      score: -18,
      signal: { label: "Deadline closed", tone: "neutral" as const },
    }
  }

  if (days === 0) {
    return {
      days,
      label: "Due today",
      tone: "bg-[#ea4335]/10 text-[#b3261e] ring-1 ring-[#ea4335]/20",
      score: 6,
      signal: { label: "Due today", tone: "red" as const },
    }
  }

  if (days <= 3) {
    return {
      days,
      label: `Deadline in ${days} ${days === 1 ? "day" : "days"}`,
      tone: "bg-[#ea4335]/10 text-[#b3261e] ring-1 ring-[#ea4335]/20",
      score: 11,
      signal: { label: "Urgent deadline", tone: "red" as const },
    }
  }

  if (days <= 14) {
    return {
      days,
      label: `${days} days left`,
      tone: "bg-[#fbbc05]/15 text-[#996800] ring-1 ring-[#fbbc05]/25",
      score: 10,
      signal: { label: "Deadline soon", tone: "yellow" as const },
    }
  }

  if (days <= 60) {
    return {
      days,
      label: `${days} days left`,
      tone: "bg-[#34a853]/10 text-[#137333] ring-1 ring-[#34a853]/20",
      score: 8,
      signal: { label: "Healthy timeline", tone: "green" as const },
    }
  }

  return {
    days,
    label: `${days} days left`,
    tone: "bg-[#4285f4]/10 text-[#1a73e8] ring-1 ring-[#4285f4]/20",
    score: 5,
    signal: { label: "Long runway", tone: "blue" as const },
  }
}

function scoreLabel(score: number) {
  if (score >= 88) return "Elite fit"
  if (score >= 78) return "Strong fit"
  if (score >= 68) return "Smart match"
  return "Worth tracking"
}

function locationSignal(location: string): OpportunitySignal | null {
  const normalized = location.toLowerCase()
  if (["remote", "hybrid", "europe", "global", "international"].some((term) => normalized.includes(term))) {
    return { label: "Flexible location", tone: "blue" }
  }
  return null
}

export function getSignalToneClass(tone: OpportunitySignalTone) {
  switch (tone) {
    case "blue":
      return "bg-[#4285f4]/10 text-[#1a73e8] ring-1 ring-[#4285f4]/15"
    case "green":
      return "bg-[#34a853]/10 text-[#137333] ring-1 ring-[#34a853]/15"
    case "yellow":
      return "bg-[#fbbc05]/15 text-[#996800] ring-1 ring-[#fbbc05]/20"
    case "red":
      return "bg-[#ea4335]/10 text-[#b3261e] ring-1 ring-[#ea4335]/15"
    default:
      return "bg-secondary text-secondary-foreground ring-1 ring-border/60"
  }
}

export function getThesisIntelligence(thesis: Thesis): OpportunityIntelligence {
  const deadline = deadlineSignal(thesis.deadline)
  const signals: OpportunitySignal[] = [deadline.signal]
  let score = 54 + deadline.score

  if (isFunded(thesis.compensation)) {
    score += 12
    signals.push({ label: thesis.compensation === "stipend" ? "Stipend available" : "Paid role", tone: "green" })
  }

  if (isVerified(thesis)) {
    score += 12
    signals.push({ label: "Verified source", tone: "blue" })
  }

  if (thesis.type === "phd") {
    score += 5
    signals.push({ label: "Research track", tone: "green" })
  }

  if (thesis.subject.split(",").filter(Boolean).length > 1) {
    score += 4
    signals.push({ label: "Multi-field", tone: "neutral" })
  }

  const flexible = locationSignal(thesis.location)
  if (flexible) {
    score += 3
    signals.push(flexible)
  }

  if (thesis.externalUrl) score += 3

  const finalScore = deadline.days < 0 ? clamp(score, 34, 62) : clamp(score, 48, 97)

  return {
    score: finalScore,
    label: scoreLabel(finalScore),
    deadlineLabel: deadline.label,
    deadlineTone: deadline.tone,
    signals: signals.slice(0, 4),
  }
}

export function getProgramIntelligence(program: TraineeProgram): OpportunityIntelligence {
  const deadline = deadlineSignal(program.deadline)
  const signals: OpportunitySignal[] = [deadline.signal]
  let score = 55 + deadline.score

  if (isFunded(program.compensation)) {
    score += 12
    signals.push({ label: program.compensation === "stipend" ? "Stipend available" : "Paid program", tone: "green" })
  }

  if (isVerified(program)) {
    score += 12
    signals.push({ label: "Verified company", tone: "blue" })
  }

  const months = Number(program.duration.replace(/[^0-9]/g, ""))
  if (months >= 6 && months <= 24) {
    score += 6
    signals.push({ label: "Structured pathway", tone: "green" })
  }

  if (program.field.split(",").filter(Boolean).length > 1) {
    score += 4
    signals.push({ label: "Cross-functional", tone: "neutral" })
  }

  const flexible = locationSignal(program.location)
  if (flexible) {
    score += 3
    signals.push(flexible)
  }

  if (program.externalUrl) score += 3

  const finalScore = deadline.days < 0 ? clamp(score, 34, 62) : clamp(score, 48, 97)

  return {
    score: finalScore,
    label: scoreLabel(finalScore),
    deadlineLabel: deadline.label,
    deadlineTone: deadline.tone,
    signals: signals.slice(0, 4),
  }
}
