"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { GlobalSearchCommand } from "@/components/global-search-command"
import {
  GraduationCap,
  Menu,
  X,
  Home,
  BookOpen,
  Briefcase,
  Newspaper,
  Info,
  LayoutDashboard,
  LogOut,
  Loader2,
} from "lucide-react"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/phd-positions", label: "PhD Positions" },
  { href: "/master-thesis", label: "Master's Theses" },
  { href: "/trainee-programs", label: "Trainee Programs" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
]

const mobileNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/phd-positions", label: "PhD Positions", icon: GraduationCap },
  { href: "/master-thesis", label: "Master's Theses", icon: BookOpen },
  { href: "/trainee-programs", label: "Trainee Programs", icon: Briefcase },
  { href: "/blog", label: "Blog", icon: Newspaper },
  { href: "/about", label: "About", icon: Info },
]

export function Navbar() {
  const { user, isLoggedIn, logout, loading } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const dashboardPath = user
    ? user.type === "admin"
      ? "/n_admin/dashboard"
      : `/dashboard/${user.type}`
    : "/login"

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-200 ${scrolled
        ? "border-b border-slate-200/80 bg-[#FAFAFB] shadow-md"
        : "border-b border-slate-200/40 bg-[#FAFAFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.702)]"
        }`}
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className={`flex items-center justify-between gap-4 transition-all duration-200 ${scrolled ? "h-16" : "h-20"
          }`}>
          {/* Logo */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 transition-opacity duration-200 hover:opacity-80"
          >
            <div className={`flex items-center justify-center rounded-lg bg-primary shadow-sm transition-all duration-200 ${scrolled ? "h-7 w-7" : "h-8 w-8"
              }`}>
              <GraduationCap className={`text-primary-foreground transition-all duration-200 ${scrolled ? "h-4 w-4" : "h-4.5 w-4.5"
                }`} />
            </div>
            <span className={`font-semibold tracking-tight text-foreground transition-all duration-200 ${scrolled ? "text-[15px]" : "text-[17px]"
              }`}>
              GraduatesCorner
            </span>
          </Link>

          {/* Desktop Navigation — pill bar */}
          <div className="hidden items-center rounded-full bg-secondary/80 p-1 ring-1 ring-border/40 lg:flex">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 ${active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <GlobalSearchCommand />

            {/* Auth — Desktop */}
            <div className="hidden items-center gap-1.5 lg:flex">
              {loading ? (
                <div className="flex h-8 w-12 items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : isLoggedIn ? (
                <>
                  <Link href={dashboardPath}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="h-8 gap-1.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground active:bg-secondary/80"
                    >
                      Log In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      size="sm"
                      className="h-8 rounded-lg text-[13px] font-medium shadow-sm"
                    >
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground"
                >
                  <Menu className="h-[18px] w-[18px]" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0 [&>button:last-child]:hidden">
                <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                <div className="flex h-full flex-col">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <Link
                      href="/"
                      className="flex items-center gap-2.5"
                      onClick={() => setOpen(false)}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                        <GraduationCap className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        GraduatesCorner
                      </span>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground" onClick={() => setOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mobile Nav Links */}
                  <nav className="flex flex-1 flex-col gap-0.5 p-3">
                    {mobileNavItems.map((item) => {
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${active
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                            }`}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      )
                    })}
                  </nav>

                  {/* Mobile Auth */}
                  <div className="border-t border-border p-4">
                    {loading ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : isLoggedIn ? (
                      <div className="flex flex-col gap-2">
                        <Link href={dashboardPath} onClick={() => setOpen(false)}>
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-2 text-[13px]"
                          >
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
                          className="w-full justify-start gap-2 text-[13px] text-muted-foreground"
                        >
                          <LogOut className="h-4 w-4" />
                          Log Out
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Link href="/login" onClick={() => setOpen(false)}>
                          <Button variant="outline" className="w-full text-[13px]">
                            Log In
                          </Button>
                        </Link>
                        <Link href="/register" onClick={() => setOpen(false)}>
                          <Button className="w-full text-[13px]">Get Started</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}