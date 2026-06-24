"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { AuthBrandingPanel } from "@/components/auth-branding-panel"
import { useAuth } from "@/lib/auth-context"
import {
  GraduationCap,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  Briefcase,
  Check,
} from "lucide-react"
import { toast } from "sonner"

type UserType = "student" | "university" | "company"

const roles = [
  {
    value: "student" as const,
    label: "Student",
    description: "Browse opportunities",
    icon: GraduationCap,
  },
  {
    value: "university" as const,
    label: "University",
    description: "Post projects",
    icon: Building2,
  },
  {
    value: "company" as const,
    label: "Company",
    description: "Recruit talent",
    icon: Briefcase,
  },
]

function RegisterForm() {
  const [selectedRole, setSelectedRole] = useState<UserType>("student")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const router = useRouter()
  const { supabase } = useAuth()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'no_profile') {
      toast.error('Your Google account is not registered. Please complete registration below.')
    } else if (error) {
      toast.error(error)
    }
  }, [searchParams])

  const handleGoogleSignUp = async () => {
    // Store role in a cookie BEFORE redirecting to Google.
    // Google strips custom query params from the redirectTo URL, so we can't
    // pass ?role=company through the redirect — it gets dropped.
    // A cookie survives the round-trip and the server callback can read it.
    document.cookie = `gc_pending_role=${selectedRole}; path=/; max-age=600; SameSite=Lax`
    document.cookie = `gc_pending_reg=true; path=/; max-age=600; SameSite=Lax`
    if (name) {
      document.cookie = `gc_pending_name=${encodeURIComponent(name)}; path=/; max-age=600; SameSite=Lax`
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      toast.error(error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          type: selectedRole,
        },
      },
    })

    setIsSubmitting(false)

    if (error) {
      if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists') ||
        error.message.toLowerCase().includes('user already')
      ) {
        toast.error(
          "An account with this email already exists. Please sign in instead.",
          {
            action: {
              label: "Sign in",
              onClick: () => router.push("/login"),
            },
            duration: 6000,
          }
        )
      } else {
        toast.error(error.message)
      }
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast.error(
        "An account with this email already exists. Please sign in instead.",
        {
          action: {
            label: "Sign in",
            onClick: () => router.push("/login"),
          },
          duration: 6000,
        }
      )
    } else {
      if (data.user) {
        toast.success("Registration successful! Redirecting to dashboard...")
        // For email signup, we redirect to dashboard after a short delay
        // Note: In a real app with email verification, they might need to verify first
        setTimeout(() => {
          router.push(`/dashboard/${selectedRole}`)
        }, 1500)
      } else {
        toast.success("Registration successful! Please check your email to verify your account.")
        router.push("/")
      }
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AuthBrandingPanel />

      <div className="flex w-full flex-col lg:w-[60%]">
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-[420px]">
            <Link href="/" className="mb-6 flex items-center gap-2.5 transition-opacity hover:opacity-80 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">Graduates Corner</span>
            </Link>

            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Create your account
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Join Graduates Corner today
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                {/* <label className="text-[13px] font-medium text-foreground">
                  I am a...
                </label> */}
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border py-2.5 transition-all ${selectedRole === role.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:bg-secondary/50"
                        }`}
                    >
                      <role.icon className={`h-4 w-4 ${selectedRole === role.value ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-[11px] font-medium ${selectedRole === role.value ? "text-primary" : "text-muted-foreground"}`}>
                        {role.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="name" className="text-[13px] font-medium text-foreground">
                  {selectedRole === 'student' ? 'Full Name' : 'Organization Name'}
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder={selectedRole === 'student' ? "e.g., John Doe" : "e.g., Technical University of Munich"}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 rounded-lg border-border bg-card px-3.5 text-[13px]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-email" className="text-[13px] font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-lg border-border bg-card px-3.5 text-[13px]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-password" className="text-[13px] font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    required
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
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                {!isSubmitting && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-background px-3 text-muted-foreground uppercase tracking-wider">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
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

            <p className="mt-5 text-center text-[13px] text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-foreground hover:text-primary transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="shrink-0 border-t border-border/50 px-6 py-3 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Graduates Corner. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}
