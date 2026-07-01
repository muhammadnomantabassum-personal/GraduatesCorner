import { cn } from "@/lib/utils"

type BrandLogoProps = {
  showText?: boolean
  size?: "xs" | "sm" | "md" | "lg"
  variant?: "light" | "dark"
  className?: string
  markClassName?: string
  textClassName?: string
}

const markSizes = {
  xs: "h-7 w-7 rounded-[10px]",
  sm: "h-8 w-8 rounded-xl",
  md: "h-9 w-9 rounded-[14px]",
  lg: "h-12 w-12 rounded-2xl",
}

const textSizes = {
  xs: "text-sm",
  sm: "text-sm",
  md: "text-[17px]",
  lg: "text-xl",
}

const svgSizes = {
  xs: "h-5 w-5",
  sm: "h-[22px] w-[22px]",
  md: "h-6 w-6",
  lg: "h-8 w-8",
}

export function BrandLogo({
  showText = true,
  size = "md",
  variant = "light",
  className,
  markClassName,
  textClassName,
}: BrandLogoProps) {
  const textColor = variant === "dark" ? "text-white" : "text-foreground"

  return (
    <span className={cn("group/logo inline-flex min-w-0 items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative isolate flex shrink-0 items-center justify-center overflow-hidden shadow-[0_14px_32px_rgba(66,133,244,0.20)] ring-1 ring-black/5 transition-all duration-300 group-hover/logo:-translate-y-0.5 group-hover/logo:shadow-[0_18px_38px_rgba(66,133,244,0.28)]",
          markSizes[size],
          markClassName,
        )}
      >
        <span
          className="absolute inset-0 opacity-95 transition-transform duration-500 ease-out group-hover/logo:rotate-[18deg]"
          style={{
            background:
              "conic-gradient(from 210deg, #4285F4 0deg, #34A853 105deg, #FBBC05 205deg, #EA4335 305deg, #4285F4 360deg)",
          }}
        />
        <span className="absolute inset-[3px] rounded-[inherit] bg-white/96 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]" />
        <span className="absolute left-[14%] top-[16%] h-1.5 w-1.5 rounded-full bg-[#4285F4] shadow-[0_0_12px_rgba(66,133,244,0.45)] transition-transform duration-300 group-hover/logo:translate-x-0.5 group-hover/logo:-translate-y-0.5" />
        <span className="absolute right-[14%] top-[22%] h-1.5 w-1.5 rounded-full bg-[#34A853] shadow-[0_0_12px_rgba(52,168,83,0.42)] transition-transform duration-300 group-hover/logo:translate-x-0.5 group-hover/logo:translate-y-0.5" />
        <span className="absolute bottom-[15%] left-[19%] h-1.5 w-1.5 rounded-full bg-[#FBBC05] shadow-[0_0_12px_rgba(251,188,5,0.42)] transition-transform duration-300 group-hover/logo:-translate-x-0.5 group-hover/logo:translate-y-0.5" />
        <span className="absolute bottom-[18%] right-[17%] h-1.5 w-1.5 rounded-full bg-[#EA4335] shadow-[0_0_12px_rgba(234,67,53,0.35)] transition-transform duration-300 group-hover/logo:-translate-y-0.5" />

        <svg
          viewBox="0 0 48 48"
          aria-hidden="true"
          className={cn(
            "relative z-10 text-[#202124] transition-transform duration-500 ease-out group-hover/logo:scale-105",
            svgSizes[size],
          )}
          fill="none"
        >
          <path
            d="M13.5 19.5 24 14l10.5 5.5L24 25 13.5 19.5Z"
            fill="currentColor"
            opacity="0.94"
          />
          <path
            d="M18 23v5.2c0 2.5 12 2.5 12 0V23"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
          <path
            d="M14.5 34c7.6-1.2 14.2-4.3 19.4-10.8"
            stroke="#4285F4"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="m33.5 23.2 1.2 6.2 5-4.1"
            fill="#34A853"
          />
        </svg>
      </span>
      {showText ? (
        <span
          className={cn(
            "brand-wordmark min-w-0 font-semibold tracking-normal transition-colors duration-200",
            textSizes[size],
            textColor,
            textClassName,
          )}
        >
          Graduates Corner
        </span>
      ) : null}
    </span>
  )
}
