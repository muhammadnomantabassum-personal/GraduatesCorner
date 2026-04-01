"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { AuthBrandingPanel } from "@/components/auth-branding-panel"
import {
  GraduationCap,
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Please enter your email address")
      return
    }
    setSubmitted(true)
    toast.success("Reset link sent! Check your inbox.")
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Panel */}
      <AuthBrandingPanel />

      {/* Right Panel */}
      <div className="flex w-full flex-col lg:w-[60%]">
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-[420px]">
            {/* Mobile logo */}
            <Link href="/" className="mb-6 flex items-center gap-2.5 transition-opacity hover:opacity-80 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">GraduatesCorner</span>
            </Link>

            {submitted ? (
              /* Success State */
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Check your email
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  We sent a password reset link to{" "}
                  <span className="font-medium text-foreground">{email}</span>.
                  <br />
                  Please check your inbox and follow the instructions.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false)
                    setEmail("")
                  }}
                  className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[13px] font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.99]"
                >
                  Send another link
                </button>

                <Link
                  href="/login"
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to login
                </Link>
              </div>
            ) : (
              /* Form State */
              <>
                {/* Icon */}
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <Mail className="h-5 w-5" />
                </div>

                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Forgot your password?
                  </h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    No worries. Enter the email associated with your account and we&apos;ll send you
                    a link to reset your password.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="reset-email" className="text-[13px] font-medium text-foreground">
                      Email address
                    </label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 rounded-lg border-border bg-card px-3.5 text-[13px]"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[13px] font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.99]"
                  >
                    Send reset link
                  </button>
                </form>

                {/* Back to login */}
                <div className="mt-5 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="shrink-0 border-t border-border/50 px-6 py-3 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} GraduatesCorner. All rights reserved.
        </div>
      </div>
    </div>
  )
}
