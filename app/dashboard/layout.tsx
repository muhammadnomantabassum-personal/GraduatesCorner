"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { BrandLogo } from "@/components/shared/brand-logo"
import { OpportunityAssistant } from "@/components/shared/opportunity-assistant"
import { SiteProgress } from "@/components/shared/site-progress"
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
  BookOpen,
  Briefcase,
  MessageSquare,
  LogOut,
  Home,
  Plus,
  PenLine,
  FileText,
  Loader2,
  Heart,
  Send,
  CalendarDays,
} from "lucide-react"

const sidebarLinks = {
  student: [
    {
      title: "General",
      links: [
        { href: "/dashboard/student", label: "Overview", mobileLabel: "Home", icon: LayoutDashboard, mobileHidden: false },
        { href: "/dashboard/student/wishlist", label: "Wishlist", mobileLabel: "Wishlist", icon: Heart, mobileHidden: false },
        { href: "/dashboard/student/calendar", label: "Deadline Calendar", mobileLabel: "Calendar", icon: CalendarDays, mobileHidden: false },
        { href: "/dashboard/student/applied", label: "Applied Posts", mobileLabel: "Applied", icon: Send, mobileHidden: false },
      ]
    },
    {
      title: "Content",
      links: [
        { href: "/dashboard/student/blogs", label: "My Blogs", mobileLabel: "Blogs", icon: FileText, mobileHidden: false },
        { href: "/dashboard/student/blogs/new", label: "Write Blog", mobileLabel: "Write", icon: PenLine, mobileHidden: true },
        { href: "/dashboard/student/testimonials", label: "My Feedback", mobileLabel: "Feedback", icon: MessageSquare, mobileHidden: false },
      ]
    }
  ],
  university: [
    {
      title: "General",
      links: [
        { href: "/dashboard/university", label: "Overview", mobileLabel: "Home", icon: LayoutDashboard, mobileHidden: false },
      ]
    },
    {
      title: "Master Thesis",
      links: [
        { href: "/dashboard/university/theses", label: "My Thesis", mobileLabel: "Thesis", icon: BookOpen, mobileHidden: false },
        { href: "/dashboard/university/theses/new", label: "Post Thesis", mobileLabel: "Post", icon: Plus, mobileHidden: true },
      ]
    },
    {
      title: "PhD Positions",
      links: [
        { href: "/dashboard/university/phd-positions", label: "My PhD Positions", mobileLabel: "PhD", icon: GraduationCap, mobileHidden: false },
        { href: "/dashboard/university/phd-positions/new", label: "Post PhD Position", mobileLabel: "Post PhD", icon: Plus, mobileHidden: true },
      ]
    },
    {
      title: "Content",
      links: [
        { href: "/dashboard/university/blogs", label: "My Blogs", mobileLabel: "Blogs", icon: FileText, mobileHidden: false },
        { href: "/dashboard/university/blogs/new", label: "Write Blog", mobileLabel: "Write", icon: PenLine, mobileHidden: true },
        { href: "/dashboard/university/testimonials", label: "My Feedback", mobileLabel: "Feedback", icon: MessageSquare, mobileHidden: false },
      ]
    }
  ],
  company: [
    {
      title: "General",
      links: [
        { href: "/dashboard/company", label: "Overview", mobileLabel: "Home", icon: LayoutDashboard, mobileHidden: false },
      ]
    },
    {
      title: "Master Thesis",
      links: [
        { href: "/dashboard/company/theses", label: "My Thesis", mobileLabel: "Thesis", icon: BookOpen, mobileHidden: false },
        { href: "/dashboard/company/theses/new", label: "Post Thesis", mobileLabel: "Post", icon: Plus, mobileHidden: true },
      ]
    },
    {
      title: "PhD Positions",
      links: [
        { href: "/dashboard/company/phd-positions", label: "My PhD Positions", mobileLabel: "PhD", icon: GraduationCap, mobileHidden: false },
        { href: "/dashboard/company/phd-positions/new", label: "Post PhD Position", mobileLabel: "Post PhD", icon: Plus, mobileHidden: true },
      ]
    },
    {
      title: "Trainee Programs",
      links: [
        { href: "/dashboard/company/trainee-programs", label: "My Programs", mobileLabel: "Programs", icon: Briefcase, mobileHidden: false },
        { href: "/dashboard/company/trainee-programs/new", label: "Post Program", mobileLabel: "Post", icon: Plus, mobileHidden: true },
      ]
    },
    {
      title: "Content",
      links: [
        { href: "/dashboard/company/blogs", label: "My Blogs", mobileLabel: "Blogs", icon: FileText, mobileHidden: false },
        { href: "/dashboard/company/blogs/new", label: "Write Blog", mobileLabel: "Write", icon: PenLine, mobileHidden: true },
        { href: "/dashboard/company/testimonials", label: "My Feedback", mobileLabel: "Feedback", icon: MessageSquare, mobileHidden: false },
      ]
    }
  ],
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, hasSession, logout, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // The URL segment is always set correctly by the server-side callback.
  // Use it as the source of truth for rendering — user.type may temporarily
  // be 'student' from the fallback while fetchProfile is in-flight.
  const pathRole = (pathname.split('/')[2] ?? 'student') as 'student' | 'university' | 'company'

  useEffect(() => {
    if (!loading && !hasSession) {
      router.push('/')
    }
  }, [hasSession, loading, router])

  // Redirect correction: if user.type is definitively loaded from DB and mismatches
  // the URL path, fix the URL. Skip if user.type is 'student' — it may be the
  // temporary fallback value while fetchProfile is still in-flight.
  useEffect(() => {
    if (!user || loading || user.type === 'admin') return
    const validRoles = ['student', 'university', 'company']
    if (!validRoles.includes(pathRole)) return
    // Only redirect when the loaded type is non-student AND differs from the URL.
    // Non-student types are never the default fallback, so this is a definitive mismatch.
    if (user.type !== 'student' && user.type !== pathRole) {
      router.replace(pathname.replace(`/dashboard/${pathRole}`, `/dashboard/${user.type}`))
    }
  }, [user, loading, pathRole, pathname, router])

  // Show loading while initializing session
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading your dashboard...</p>
      </div>
    )
  }

  // If loading finished but we have no user/session, show nothing while redirecting
  if (!user || !hasSession) {
    return null
  }

  // Always render based on URL path role — prevents flash of wrong sidebar
  // while fetchProfile is still completing in the background.
  const sidebarRole = (pathRole in sidebarLinks ? pathRole : (user?.type ?? 'student')) as 'student' | 'university' | 'company'
  const sections = sidebarLinks[sidebarRole] || sidebarLinks.student


  return (
    <div className="flex min-h-screen">
      <SiteProgress />
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <BrandLogo size="sm" textClassName="font-bold text-sidebar-foreground" />
        </div>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {sections.map((section, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <h3 className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
                {section.title}
              </h3>
              {section.links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
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
              router.push("/")
            }}
            className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <BrandLogo size="xs" showText={false} />
            <span className="text-sm font-bold text-foreground">Dashboard</span>
          </div>
          <div className="hidden lg:block">
            <h2 className="text-sm font-medium text-muted-foreground">
              {sidebarRole === "student" ? "Student" : user.organization || user.name} Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {user.name}
            </span>
            <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground lg:flex overflow-hidden">
              {user.avatar ? (
                <Image src={user.avatar} alt={user.name || 'User'} width={32} height={32} className="h-full w-full object-cover" />
              ) : (
                user.name?.charAt(0) || 'U'
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="lg:hidden">
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground outline-none overflow-hidden">
                  {user.avatar ? (
                    <Image src={user.avatar} alt={user.name || 'User'} width={32} height={32} className="h-full w-full object-cover" />
                  ) : (
                    user.name?.charAt(0) || 'U'
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.type}</p>
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
                    router.push("/")
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
          {sections.flatMap(s => s.links).filter((link) => !link.mobileHidden).map((link) => {
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
                <span className="truncate sm:hidden">{link.mobileLabel}</span>
                <span className="hidden truncate sm:inline">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <main className="flex-1 overflow-x-hidden bg-background p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <OpportunityAssistant surface="dashboard" />
    </div>
  )
}
