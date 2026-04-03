"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Briefcase,
  MessageSquare,
  FileText,
  PenLine,
  Plus,
  LogOut,
  Home,
  Shield,
  Loader2,
} from "lucide-react"

const sidebarSections = [
  {
    title: "General",
    links: [
      { href: "/n_admin/dashboard", label: "Overview", mobileLabel: "Home", icon: LayoutDashboard, mobileHidden: false },
      { href: "/n_admin/dashboard/users", label: "Users", mobileLabel: "Users", icon: Users, mobileHidden: false },
    ]
  },
  {
    title: "Master Thesis",
    links: [
      { href: "/n_admin/dashboard/theses", label: "Master Thesis", mobileLabel: "Thesis", icon: BookOpen, mobileHidden: false },
      { href: "/n_admin/dashboard/theses/new", label: "Post Thesis", mobileLabel: "Post", icon: Plus, mobileHidden: true },
    ]
  },
  {
    title: "PhD Positions",
    links: [
      { href: "/n_admin/dashboard/phd-positions", label: "PHD Positions", mobileLabel: "PHD", icon: GraduationCap, mobileHidden: false },
      { href: "/n_admin/dashboard/phd-positions/new", label: "Post PHD Positions", mobileLabel: "Post PHD", icon: Plus, mobileHidden: true },
    ]
  },
  {
    title: "Trainee Programs",
    links: [
      { href: "/n_admin/dashboard/trainee-programs", label: "Programs", mobileLabel: "Programs", icon: Briefcase, mobileHidden: false },
      { href: "/n_admin/dashboard/trainee-programs/new", label: "Post Program", mobileLabel: "Post", icon: Plus, mobileHidden: true },
    ]
  },
  {
    title: "Content",
    links: [
      { href: "/n_admin/dashboard/blogs", label: "Blog Posts", mobileLabel: "Blogs", icon: FileText, mobileHidden: false },
      { href: "/n_admin/dashboard/blogs/new", label: "Write Blog", mobileLabel: "Write", icon: PenLine, mobileHidden: true },
      { href: "/n_admin/dashboard/testimonials", label: "Testimonials", mobileLabel: "Reviews", icon: MessageSquare, mobileHidden: false },
    ]
  },
]

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn, logout, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && (!isLoggedIn || user?.type !== "admin")) {
      router.push("/n_admin")
    }
  }, [isLoggedIn, user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Verifying admin session...</p>
      </div>
    )
  }

  if (!isLoggedIn || !user || user.type !== "admin") {
    return null
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <GraduationCap className="h-6 w-6 text-sidebar-primary" />
          <span className="font-bold">GraduatesCorner</span>
          <span className="ml-auto rounded-full bg-sidebar-primary/10 px-2 py-0.5 text-[9px] font-semibold text-sidebar-primary">
            ADMIN
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {sidebarSections.map((section, idx) => (
            <div key={idx} className="flex flex-col gap-0.5">
              <h3 className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
                {section.title}
              </h3>
              {section.links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <Link href="/">
            <Button
              variant="ghost"
              className="mb-2 w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-accent hover:text-accent-foreground"
            >
              <Home className="h-4 w-4" /> Back to Site
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={() => {
              logout()
              router.push("/n_admin")
            }}
            className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-foreground">Admin</span>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium text-muted-foreground">Admin Dashboard</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">{user.name}</span>
            {/* Desktop avatar */}
            <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground lg:flex">
              A
            </div>
            {/* Mobile avatar with dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="lg:hidden">
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground outline-none">
                  A
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">Admin</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex cursor-pointer items-center gap-2">
                    <Home className="h-4 w-4" />
                    Back to Site
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    logout()
                    router.push("/n_admin")
                  }}
                  className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile navigation */}
        <nav className="flex items-center justify-around border-b border-border bg-card sm:justify-start sm:overflow-x-auto sm:px-2 sm:scrollbar-none lg:hidden">
          {sidebarSections.flatMap(s => s.links).filter((link) => !link.mobileHidden).map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex shrink-0 flex-col items-center gap-0.5 border-b-2 px-2 py-2 text-[9px] font-medium transition-colors sm:flex-row sm:gap-1.5 sm:px-3 sm:py-3 sm:text-xs ${isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                <link.icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span className="truncate">{link.mobileLabel}</span>
              </Link>
            )
          })}
        </nav>

        <main className="flex-1 bg-background p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
