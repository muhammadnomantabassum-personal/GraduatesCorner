"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function SiteProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY
      const height = document.documentElement.scrollHeight - window.innerHeight
      setProgress(height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0)
    }

    updateProgress()
    window.addEventListener("scroll", updateProgress, { passive: true })
    window.addEventListener("resize", updateProgress)

    return () => {
      window.removeEventListener("scroll", updateProgress)
      window.removeEventListener("resize", updateProgress)
    }
  }, [pathname])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-1 bg-transparent">
      <div
        className="h-full bg-[linear-gradient(90deg,#4285F4,#34A853,#FBBC05,#EA4335)] shadow-[0_0_18px_rgba(66,133,244,0.35)] transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
