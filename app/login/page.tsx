"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { AuthBrandingPanel } from "@/components/auth-branding-panel"
import {
  GraduationCap,
  Building2,
  Briefcase,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

const tabs = [
  { value: "student" as const, label: "Student", icon: GraduationCap },
  { value: "university" as const, label: "University", icon: Building2 },
  { value: "company" as const, label: "Company", icon: Briefcase },
]

function LoginForm() {
  const [activeTab, setActiveTab] = useState<"student" | "university" | "company">("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { supabase } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get("error")
    if (error === "no_account") {
      toast.error("No account found for this email. Please register first.", {
        action: { label: "Register", onClick: () => router.push("/register") },
        duration: 7000,
      })
    } else if (error === "role_mismatch") {
      toast.error("This account is registered under a different role. Please select the correct account type.", {
        duration: 7000,
      })
    } else if (error) {
      toast.error(decodeURIComponent(error))
    }

    if (error) router.replace("/login")
  }, [searchParams, router])

  const handleGoogleLogin = async () => {
    // Store the selected role in a cookie before Google redirect.
    // Google strips custom query params from redirectTo, so ?role=company is lost.
    // NOTE: We do NOT set gc_pending_reg=true here — returning users must not
    // be re-registered. Brand-new users are detected in the callback via
    // isNewUser = !meta.type (new Google users have no meta.type yet).
    document.cookie = `gc_pending_role=${activeTab}; path=/; max-age=600; SameSite=Lax`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    })
    if (error) toast.error(error.message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please enter your email and password")
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.user) {
        toast.error("Invalid email or password.")
        return
      }

      // Verify the role matches
      const { data: profile } = await supabase
        .from("profiles")
        .select("type")
        .eq("id", data.user.id)
        .single()

      if (!profile) {
        await supabase.auth.signOut()
        toast.error("No account found. Please register first.", {
          action: { label: "Register", onClick: () => router.push("/register") },
        })
        return
      }

      if (profile.type !== activeTab) {
        await supabase.auth.signOut()
        const expectedLabel = tabs.find(t => t.value === activeTab)?.label
        const actualLabel = tabs.find(t => t.value === profile.type)?.label ?? profile.type
        toast.error(
          `You selected "${expectedLabel}" but this account is a "${actualLabel}". Please select the correct role.`,
          { duration: 7000 }
        )
        return
      }

      toast.success("Welcome back!")
      router.push("/")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      {/* Mobile logo */}
      <Link href="/" className="mb-6 flex items-center gap-2.5 transition-opacity hover:opacity-80 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-foreground">GradNexus</span>
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Welcome back
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Tabs */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-regular text-foreground">If new here, than select your role</label>
          <div className="flex rounded-lg bg-secondary p-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-all duration-200 ${activeTab === tab.value
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[13px] font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 rounded-lg border-border bg-card px-3.5 text-[13px]"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[13px] font-medium text-foreground">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-foreground hover:text-primary transition-colors"
            >
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-lg border-border bg-card px-3.5 pr-10 text-[13px]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[13px] font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.99] disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          {!isSubmitting && <ArrowRight className="h-3.5 w-3.5" />}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[11px]">
          <span className="bg-background px-3 text-muted-foreground uppercase tracking-wider">or</span>
        </div>
      </div>

      {/* Google Button */}
      <div className="space-y-2.5">
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-card text-[13px] font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.99]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
        <p className="text-center text-[11px] text-muted-foreground/70">
          Already authenticated users will be loged in to their account .
        </p>
      </div>

      {/* Footer */}
      <p className="mt-5 text-center text-[13px] text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-foreground hover:text-primary transition-colors">
          Create one
        </Link>
      </p>

      <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
        Admin access is restricted to authorized personnel.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <AuthBrandingPanel />
      <div className="flex w-full flex-col lg:w-[60%]">
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
        <div className="shrink-0 border-t border-border/50 px-6 py-3 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} GradNexus. All rights reserved.
        </div>
      </div>
    </div>
  )
}
