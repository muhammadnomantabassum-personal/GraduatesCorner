"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { GraduationCap, Building2, Briefcase, Check, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

const roles = [
  {
    value: "student" as const,
    label: "Student",
    description: "Browse thesis opportunities and share your research ideas",
    icon: GraduationCap,
  },
  {
    value: "university" as const,
    label: "University",
    description: "Post thesis projects and connect with talented students",
    icon: Building2,
  },
  {
    value: "company" as const,
    label: "Company",
    description: "Offer industry thesis projects and recruit top talent",
    icon: Briefcase,
  },
]

interface RoleSelectionModalProps {
  open: boolean
  onClose: () => void
  userId?: string
}

export function RoleSelectionModal({ open, onClose, userId }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<"student" | "university" | "company">("student")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { supabase, user, refreshProfile } = useAuth()
  const router = useRouter()

  // Effect to automatically close/redirect if profile is already set
  // This handles the case where Google Signup already set the role
  useEffect(() => {
    if (open && user && user.type !== 'student') {
      onClose()
      router.push(user.type === 'admin' ? "/n_admin/dashboard" : `/dashboard/${user.type}`)
    }
  }, [open, user, onClose, router])

  const handleComplete = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    
    try {
      let targetId = userId || user?.id
      
      // If we don't have a targetId yet (common in OAuth flow if state hasn't synced), 
      // try to get it directly from the session
      if (!targetId) {
        const { data: { session } } = await supabase.auth.getSession()
        targetId = session?.user?.id
      }

      if (!targetId) {
        toast.error("Authentication required. Please sign in again.")
        return
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          type: selectedRole,
          organization: selectedRole !== "student" ? (user?.name || "Organization") : null
        })
        .eq("id", targetId)

      if (updateError) throw updateError

      // Force a profile refresh to update the global auth state
      await refreshProfile()

      toast.success("Account setup complete!", {
        description: `Welcome! You are now registered as a ${selectedRole}.`,
        duration: 5000,
      })

      onClose()
      
      router.push(`/dashboard/${selectedRole}`)
    } catch (error: any) {
      console.error("Unable to complete role setup.")
      toast.error("Failed to update role")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(val) => {
        // Prevent closing if it's mandatory setup
        if (!val) return
      }}
    >
      <DialogContent 
        className="sm:max-w-[480px]" 
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">How will you use Graduates Corner?</DialogTitle>
          <DialogDescription>
            Select your role to personalize your experience.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {roles.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => setSelectedRole(role.value)}
              className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${selectedRole === role.value
                ? "border-primary/40 bg-primary/[0.04] ring-1 ring-primary/20"
                : "border-border bg-card hover:border-border hover:bg-secondary/50"
                }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selectedRole === role.value ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  }`}
              >
                <role.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground">{role.label}</p>
                <p className="text-[12px] leading-relaxed text-muted-foreground">{role.description}</p>
              </div>
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${selectedRole === role.value ? "border-primary bg-primary" : "border-border"
                  }`}
              >
                {selectedRole === role.value && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button
            className="w-full"
            onClick={handleComplete}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
