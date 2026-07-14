"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { trackAnalyticsEvent } from "@/lib/analytics"

interface WishlistItem {
  thesis_id?: string
  program_id?: string
}

interface WishlistContextType {
  wishlistItems: WishlistItem[]
  loading: boolean
  isInWishlist: (itemId: string, type: "thesis" | "program") => boolean
  toggleWishlist: (itemId: string, type: "thesis" | "program") => Promise<void>
  refreshWishlist: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, supabase } = useAuth()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchWishlist = useCallback(async () => {
    if (!user || user.type !== "student") {
      setWishlistItems([])
      return
    }

    const { data, error } = await supabase
      .from("wishlist")
      .select("thesis_id, program_id")
      .eq("user_id", user.id)

    if (error) {
      console.error("Unable to load the wishlist.")
    } else {
      setWishlistItems(data || [])
    }
  }, [user, supabase])

  useEffect(() => {
    if (typeof window === "undefined") return

    const load = () => {
      fetchWishlist()
    }

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
      cancelIdleCallback?: (handle: number) => void
    }

    if (idleWindow.requestIdleCallback && idleWindow.cancelIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(load, { timeout: 2000 })
      return () => idleWindow.cancelIdleCallback?.(idleId)
    }

    const timeoutId = globalThis.setTimeout(load, 250)
    return () => globalThis.clearTimeout(timeoutId)
  }, [fetchWishlist])

  const isInWishlist = useCallback((itemId: string, type: "thesis" | "program") => {
    return wishlistItems.some((item) => 
      type === "thesis" ? item.thesis_id === itemId : item.program_id === itemId
    )
  }, [wishlistItems])

  const toggleWishlist = async (itemId: string, type: "thesis" | "program") => {
    if (!user) {
      toast.error("Please login to save items")
      return
    }

    if (user.type !== "student") {
      toast.error("Only students can save items to wishlist")
      return
    }

    const isCurrentlyIn = isInWishlist(itemId, type)
    
    // Optimistic update
    const newItem = type === "thesis" ? { thesis_id: itemId } : { program_id: itemId }
    if (isCurrentlyIn) {
      setWishlistItems(prev => prev.filter(item => 
        type === "thesis" ? item.thesis_id !== itemId : item.program_id !== itemId
      ))
    } else {
      setWishlistItems(prev => [...prev, newItem])
    }

    if (isCurrentlyIn) {
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", user.id)
        .eq(type === "thesis" ? "thesis_id" : "program_id", itemId)

      if (error) {
        toast.error("Failed to remove from wishlist")
        // Rollback
        setWishlistItems(prev => [...prev, newItem])
      } else {
        toast.success("Removed from wishlist")
        trackAnalyticsEvent("wishlist_remove", {
          item_id: itemId,
          opportunity_type: type,
        })
      }
    } else {
      const { error } = await supabase
        .from("wishlist")
        .insert({
          user_id: user.id,
          [type === "thesis" ? "thesis_id" : "program_id"]: itemId
        })

      if (error) {
        toast.error("Failed to add to wishlist")
        // Rollback
        setWishlistItems(prev => prev.filter(item => 
          type === "thesis" ? item.thesis_id !== itemId : item.program_id !== itemId
        ))
      } else {
        toast.success("Added to wishlist")
        trackAnalyticsEvent("wishlist_save", {
          item_id: itemId,
          opportunity_type: type,
        })
      }
    }
  }

  return (
    <WishlistContext.Provider value={{ wishlistItems, loading, isInWishlist, toggleWishlist, refreshWishlist: fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
