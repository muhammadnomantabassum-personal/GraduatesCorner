"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { ownedAvatarPath } from "@/lib/avatar-storage"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, Trash2, Settings, ImagePlus } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProfilePhotoSectionProps {
  size?: "sm" | "md" | "lg"
  editable?: boolean
}

export function ProfilePhotoSection({ size = "md", editable = true }: ProfilePhotoSectionProps) {
  const { user, supabase, updateProfile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  }

  const initials = (user?.organization || user?.name || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, WebP, or GIF image")
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB")
      return
    }

    let uploadedPath: string | null = null
    let profileSaved = false
    try {
      setUploading(true)
      const fileExt = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[file.type]
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          upsert: false,
          cacheControl: "60",
        })

      if (uploadError) {
        // If bucket doesn't exist, we might need to instruct user or handle it
        // But usually it should be pre-configured
        throw uploadError
      }
      uploadedPath = fileName

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName)

      // Update profile
      await updateProfile({ avatar: publicUrl })
      profileSaved = true
      const oldPath = ownedAvatarPath(user.avatar, process.env.NEXT_PUBLIC_SUPABASE_URL, user.id)
      if (oldPath) {
        const { error } = await supabase.storage.from("avatars").remove([oldPath])
        if (error) {
          toast.error("Photo updated, but the old file could not be deleted. Contact admin@graduatescorner.com for removal.")
          return
        }
      }
      toast.success("Profile photo updated")
    } catch {
      if (uploadedPath && !profileSaved) {
        const { error } = await supabase.storage.from("avatars").remove([uploadedPath])
        if (error) toast.error("The unused upload could not be deleted. Contact admin@graduatescorner.com for removal.")
      }
      console.error("Unable to upload the profile image.")
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removePhoto = async () => {
    if (!user) return
    try {
      setUploading(true)
      const path = ownedAvatarPath(user.avatar, process.env.NEXT_PUBLIC_SUPABASE_URL, user.id)
      if (path) {
        const { error } = await supabase.storage.from("avatars").remove([path])
        if (error) throw error
      }
      await updateProfile({ avatar: "" }) // Set to empty string to use fallback
      toast.success("Profile photo removed")
    } catch {
      toast.error("Failed to remove photo")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative group">
      <Avatar className={`${sizeClasses[size]} shrink-0 shadow-sm border-2 border-background`}>
        {user?.avatar && <AvatarImage src={user.avatar} alt={user.name || "User"} className="object-cover" />}
        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {editable && (
        <>
          <div className="absolute -bottom-1 -right-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full shadow-md hover:scale-105 transition-transform"
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => fileInputRef.current?.click()}
                  className="group cursor-pointer"
                >
                  <ImagePlus className="mr-2 h-4 w-4 transition-colors group-focus:text-black" />
                  <span>Change Photo</span>
                </DropdownMenuItem>
                {user?.avatar && (
                  <DropdownMenuItem
                    onClick={removePhoto}
                    className="group cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4 transition-colors group-focus:text-black" />
                    <span>Remove Photo</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </>
      )}
    </div>
  )
}
