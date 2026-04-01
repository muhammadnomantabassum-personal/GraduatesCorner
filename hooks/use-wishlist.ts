"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export function useWishlist() {
  const { user, supabase } = useAuth()
  const [wishlistItems, setWishlistItems] = useState<{ thesis_id?: string; program_id?: string }[]>([])
  const [loading, setLoading] = useState(false)

  const fetchWishlist = useCallback(async () => {
    if (!user || user.type !== "student") return

    const { data, error } = await supabase
      .from("wishlist")
      .select("thesis_id, program_id")
      .eq("user_id", user.id)

    if (error) {
      console.error("Error fetching wishlist:", error)
    } else {
      setWishlistItems(data || [])
    }
  }, [user, supabase])

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  const isInWishlist = (itemId: string, type: "thesis" | "program") => {
    return wishlistItems.some((item) => 
      type === "thesis" ? item.thesis_id === itemId : item.program_id === itemId
    )
  }

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
    setLoading(true)

    if (isCurrentlyIn) {
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", user.id)
        .eq(type === "thesis" ? "thesis_id" : "program_id", itemId)

      if (error) {
        toast.error("Failed to remove from wishlist")
      } else {
        setWishlistItems((prev) => 
          prev.filter((item) => 
            type === "thesis" ? item.thesis_id !== itemId : item.program_id !== itemId
          )
        )
        toast.success("Removed from wishlist")
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
      } else {
        setWishlistItems((prev) => [...prev, { [type === "thesis" ? "thesis_id" : "program_id"]: itemId }])
        toast.success("Added to wishlist")
      }
    }
    setLoading(false)
  }

  return { wishlistItems, isInWishlist, toggleWishlist, loading, refreshWishlist: fetchWishlist }
}
