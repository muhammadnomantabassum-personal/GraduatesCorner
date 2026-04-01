"use client"

import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

export function LogoutLoader() {
  const { isLoggingOut } = useAuth()

  if (!isLoggingOut) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-xl bg-card p-8 shadow-2xl ring-1 ring-border">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-semibold text-foreground">Logging you out...</p>
        <p className="text-sm text-muted-foreground">Please wait a moment</p>
      </div>
    </div>
  )
}
