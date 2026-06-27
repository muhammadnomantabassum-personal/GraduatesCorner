"use client"

import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  GraduationCap,
  Menu,
  X,
  BookOpen,
  Briefcase,
  Newspaper,
  MessageSquare,
  Info,
  LayoutDashboard,
  LogOut,
  Microscope,
  Sparkles,
} from "lucide-react"

const navLinks = [
  { href: "/master-thesis", label: "Master's Thesis", icon: BookOpen },
  { href: "/phd-positions", label: "PhD Positions", icon: Microscope },
  { href: "/trainee-programs", label: "Trainee Programs", icon: Briefcase },
  { href: "/blog", label: "Blog", icon: Newspaper },
  { href: "/testimonials", label: "Testimonials", icon: MessageSquare },
  { href: "/about", label: "About", icon: Info },
]

export function Header() {
  const { user, isLoggedIn, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const dashboardPath = user
    ? user.type === "admin"
      ? "/n_admin/dashboard"
      : `/dashboard/${user.type}`
    : "/login"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-card/90 shadow-[0_10px_40px_rgba(66,133,244,0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-card/78">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(66,133,244,0.22)]">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="brand-wordmark text-lg font-bold text-foreground">Graduates Corner</span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-border/80 bg-background/65 p-1 shadow-inner lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground hover:shadow-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isLoggedIn ? (
            <>
              <Link href={dashboardPath}>
                <Button variant="outline" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="gap-2 shadow-[0_12px_28px_rgba(66,133,244,0.18)]">
                  <Sparkles className="h-4 w-4" />
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  <span className="font-bold text-foreground">Graduates Corner</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 p-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-border p-4">
                {isLoggedIn ? (
                  <div className="flex flex-col gap-2">
                    <Link href={dashboardPath} onClick={() => setOpen(false)}>
                      <Button variant="outline" className="w-full gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        logout()
                        setOpen(false)
                      }}
                      className="w-full gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href="/login" onClick={() => setOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Log In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setOpen(false)}>
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
