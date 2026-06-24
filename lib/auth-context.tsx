"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
  useCallback,
} from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as AppUser, UserType } from "@/lib/data/types"
import { useRouter } from "next/navigation"
import type {
  SupabaseClient,
  AuthChangeEvent,
  Session,
} from "@supabase/supabase-js"
import { toast } from "sonner"

interface AuthContextType {
  user: AppUser | null
  isLoggedIn: boolean
  hasSession: boolean
  login: (email: string, password: string) => Promise<boolean>
  adminLogin: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<AppUser>) => Promise<void>
  loading: boolean
  isLoggingOut: boolean
  supabase: SupabaseClient
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [hasSession, setHasSession] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const supabase = useMemo(() => createClient(), [])

  // Build an AppUser directly from the Supabase auth user metadata
  // Used as an instant fallback when the DB profile row isn't ready yet
  const buildFallbackUser = useCallback((authUser: any): AppUser => ({
    id: authUser.id,
    email: authUser.email!,
    name:
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split("@")[0] ||
      "User",
    type: (authUser.user_metadata?.type as UserType) || "student",
    organization: undefined,
    bio: undefined,
    avatar: authUser.user_metadata?.avatar_url || undefined,
    createdAt: authUser.created_at || new Date().toISOString(),
    welcomeEmailSent: false,
  }), [])

  // Fetch profile from DB — no retries, instant fallback prevents spinner
  const fetchProfile = useCallback(async (authUser: any): Promise<AppUser> => {
    try {
      const { data: p, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (!error && p) {
        return {
          id: authUser.id,
          email: authUser.email!,
          name:
            p.name ||
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            authUser.email?.split("@")[0] ||
            "User",
          type: p.type as UserType,
          organization: p.organization ?? undefined,
          bio: p.bio ?? undefined,
          avatar: p.avatar || authUser.user_metadata?.avatar_url || undefined,
          createdAt: p.created_at,
          welcomeEmailSent: p.welcome_email_sent ?? false,
        }
      }
    } catch {
      // fall through to fallback
    }
    // Profile row not found — use auth metadata so the UI never breaks
    return buildFallbackUser(authUser)
  }, [supabase, buildFallbackUser])

  const refreshProfile = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      if (session?.user) {
        const appUser = await fetchProfile(session.user)
        setUser(appUser)
      }
    } catch (err) {
      console.error("Refresh profile error:", err)
    }
  }, [supabase, fetchProfile])

  const updateProfile = useCallback(async (updates: Partial<AppUser>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: updates.name,
          bio: updates.bio,
          avatar: updates.avatar,
          organization: updates.organization,
        })
        .eq("id", user.id)

      if (error) throw error
      
      await refreshProfile()
    } catch (err) {
      console.error("Update profile error:", err)
      throw err
    }
  }, [user, supabase, refreshProfile])

  useEffect(() => {
    let mounted = true

    // onAuthStateChange is the single source of truth.
    // INITIAL_SESSION fires synchronously on subscription creation with
    // whatever session is currently in storage — handles both fresh page loads
    // and post-OAuth redirects.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return

      if (event === "SIGNED_OUT") {
        setUser(null)
        setHasSession(false)
        setLoading(false)
        return
      }

      // Handle initial page load — fires once when the listener is created
      if (event === "INITIAL_SESSION") {
        if (!session?.user) {
          setHasSession(false)
          setUser(null)
          setLoading(false)
          return
        }

        // Authenticated on page load — show fallback instantly, then upgrade
        const fallback = buildFallbackUser(session.user)
        setUser(fallback)
        setHasSession(true)
        setLoading(false)

        // Fetch the real profile OUTSIDE the callback to avoid deadlocking
        // the Supabase auth event queue (queries use the same client).
        fetchProfile(session.user).then((appUser) => {
          if (mounted) setUser(appUser)
        })
        return
      }

      // Handle live auth events (after initial load)
      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        if (!session?.user) return // safety guard

        const fallback = buildFallbackUser(session.user)
        setUser(fallback)
        setHasSession(true)
        setLoading(false)

        // Fire and forget — don't block the auth event queue
        fetchProfile(session.user).then((appUser) => {
          if (mounted) setUser(appUser)
        })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, buildFallbackUser, fetchProfile])

  // ── public API ─────────────────────────────────────────────────────────────

  const login = async (
    email: string,
    password: string,
  ): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error || !data.user) return false
    return true
  }

  const adminLogin = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) return false

    const appUser = await fetchProfile(data.user)
    if (appUser.type !== "admin") {
      await supabase.auth.signOut()
      return false
    }

    setUser(appUser)
    setHasSession(true)
    return true
  }

  const logout = async () => {
    setIsLoggingOut(true)
    const toastId = toast.loading("Logging out...")

    try {
      // Clear UI state
      setUser(null)
      setHasSession(false)

      await supabase.auth.signOut()
      
      toast.success("Logged out successfully", { id: toastId })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Error during logout", { id: toastId })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        hasSession,
        login,
        adminLogin,
        logout,
        refreshProfile,
        updateProfile,
        loading,
        isLoggingOut,
        supabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
