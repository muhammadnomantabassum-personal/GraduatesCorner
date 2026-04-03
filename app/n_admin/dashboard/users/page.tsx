"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import {
  Users,
  GraduationCap,
  Building2,
  Briefcase,
  Mail,
  CalendarDays,
  Loader2,
} from "lucide-react"
import type { User, UserType } from "@/lib/data/types"
import { toast } from "sonner"

type FilterTab = "all" | UserType

export default function AdminUsersPage() {
  const { supabase } = useAuth()
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        toast.error("Failed to fetch users")
      } else {
        setAllUsers(data.map((u: any) => ({
          id: u.id,
          name: u.name || 'User',
          email: u.email,
          type: u.type as UserType,
          organization: u.organization,
          bio: u.bio,
          avatar: u.avatar,
          createdAt: u.created_at
        })))
      }
      setLoading(false)
    }

    fetchUsers()
  }, [supabase])

  const nonAdminUsers = useMemo(() => 
    allUsers.filter((u) => u.type !== "admin"),
    [allUsers]
  )

  const filtered = useMemo(() =>
    activeTab === "all" ? nonAdminUsers : nonAdminUsers.filter((u) => u.type === activeTab),
    [nonAdminUsers, activeTab]
  )

  const counts = {
    all: nonAdminUsers.length,
    student: nonAdminUsers.filter((u) => u.type === "student").length,
    university: nonAdminUsers.filter((u) => u.type === "university").length,
    company: nonAdminUsers.filter((u) => u.type === "company").length,
    admin: 0,
  }

  const tabs: { key: FilterTab; label: string; icon: typeof Users }[] = [
    { key: "all", label: "All Users", icon: Users },
    { key: "student", label: "Students", icon: GraduationCap },
    { key: "university", label: "Universities", icon: Building2 },
    { key: "company", label: "Companies", icon: Briefcase },
  ]

  const roleConfig = {
    student: { label: "Student", color: "bg-primary/10 text-primary" },
    university: { label: "University", color: "bg-accent/10 text-accent" },
    company: { label: "Company", color: "bg-emerald-500/10 text-emerald-700" },
    admin: { label: "Admin", color: "bg-red-500/10 text-red-700" },
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-foreground sm:text-xl">Registered Users</h1>
        <p className="text-sm text-muted-foreground">
          All registered students, universities, and companies
        </p>
      </div>

      {/* Mobile: Select dropdown */}
      <div className="mb-6 sm:hidden">
        <Select value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => (
              <SelectItem key={tab.key} value={tab.key}>
                <span className="flex items-center gap-2">
                  <tab.icon className="h-3.5 w-3.5 text-foreground" />
                  {tab.label}
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {counts[tab.key as keyof typeof counts]}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Inline tabs */}
      <div className="mb-6 hidden gap-1 rounded-lg border border-border bg-muted/30 p-1 sm:flex">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex shrink-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            <span
              className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                activeTab === tab.key
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {counts[tab.key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* User List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground text-sm">Loading users...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((u) => {
            const config = roleConfig[u.type as keyof typeof roleConfig]
            return (
              <Card key={u.id} className="transition-colors hover:bg-secondary/30">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground sm:h-10 sm:w-10 sm:text-sm overflow-hidden relative">
                        {u.avatar ? (
                          <Image src={u.avatar} alt={u.name} fill className="object-cover" />
                        ) : (
                          u.organization
                            ? u.organization.split(" ").map((n) => n[0]).join("").slice(0, 2)
                            : u.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {u.organization || u.name}
                        </p>
                        {u.bio && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {u.bio}
                          </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex min-w-0 items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            Joined{" "}
                            {new Date(u.createdAt).toLocaleDateString("en-GB", {
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`self-start shrink-0 text-[10px] sm:self-auto ${config?.color || ""}`}
                    >
                      {config?.label || u.type}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {filtered.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="mb-3 h-12 w-12 text-muted-foreground/30" />
                <h3 className="mb-1 text-base font-semibold text-foreground">No users found</h3>
                <p className="text-sm text-muted-foreground">
                  No {activeTab === "all" ? "" : activeTab} users registered yet
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
