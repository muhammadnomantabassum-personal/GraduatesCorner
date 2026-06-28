import { Check } from "lucide-react"

type VerifiedBadgeProps = {
  compact?: boolean
  className?: string
  badge?: "verified" | "trusted" | "featured"
}

const badgeCopy = {
  verified: "Verified",
  trusted: "Trusted",
  featured: "Featured",
}

export function VerifiedBadge({ compact, className = "", badge = "verified" }: VerifiedBadgeProps) {
  const label = badgeCopy[badge] || badgeCopy.verified

  return (
    <span
      title={`${label} organization`}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-[#1877F2] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm shadow-[#1877F2]/20 ring-1 ring-white/50 ${className}`}
    >
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[#1877F2]">
        <Check className="h-2.5 w-2.5 stroke-[4]" />
      </span>
      {!compact && <span>{label}</span>}
    </span>
  )
}
