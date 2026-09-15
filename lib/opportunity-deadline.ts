export type DeadlineType = "fixed" | "not_specified" | "rolling" | "until_filled"

export function deadlineLabel(deadline: string | null | undefined, type?: string | null) {
  if (deadline) return new Date(`${deadline.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
  if (type === "until_filled") return "Open until filled"
  if (type === "rolling") return "Applications reviewed continuously"
  return "Deadline not specified — apply early"
}

export function isDeadlineOpen(deadline: string | null | undefined) {
  return !deadline || deadline.slice(0, 10) >= new Date().toISOString().slice(0, 10)
}

/** Only explicit application language qualifies; never infer rolling from an absent date. */
export function inferDeadlineType(deadline: string | null, text: string): DeadlineType {
  if (deadline) return "fixed"
  if (/\b(?:open|accept(?:ing)? applications?|applications? (?:are )?accepted) until (?:the (?:position|role) is )?filled\b/i.test(text)) return "until_filled"
  if (/\b(?:applications? (?:are |will be )?(?:reviewed|assessed|considered|processed) (?:continuously|on (?:a )?rolling basis)|rolling (?:applications?|admissions?)|(?:review|assess|consider|process) applications? (?:continuously|on (?:a )?rolling basis))\b/i.test(text)) return "rolling"
  return "not_specified"
}
