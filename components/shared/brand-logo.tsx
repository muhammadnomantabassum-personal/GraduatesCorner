import Image from "next/image"
import { cn } from "@/lib/utils"
type BrandLogoProps = { showText?: boolean; size?: "xs" | "sm" | "md" | "lg"; variant?: "light" | "dark"; className?: string; markClassName?: string; textClassName?: string }
const markSizes = {"xs":"h-7 w-7","sm":"h-8 w-8","md":"h-10 w-10","lg":"h-12 w-12"}
const textSizes = { xs: "text-sm", sm: "text-sm", md: "text-[17px]", lg: "text-xl" }
export function BrandLogo({ showText = true, size = "md", variant = "light", className, markClassName, textClassName }: BrandLogoProps) {
  return <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
    <Image src="/gc-logo-512.png" alt={showText ? "" : "Graduates Corner"} width={64} height={64} className={cn("shrink-0 rounded-[16%] shadow-sm", markSizes[size], markClassName)} />
    {showText && <span className={cn("brand-wordmark min-w-0 font-semibold tracking-[-0.025em]", textSizes[size], variant === "dark" ? "text-white" : "text-[#102B46] dark:text-[#F7F4EC]", textClassName)}>Graduates Corner</span>}
  </span>
}
