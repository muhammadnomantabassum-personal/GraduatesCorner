"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
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
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB")
      return
    }

    try {
      setUploading(true)
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          upsert: true,
        })

      if (uploadError) {
        // If bucket doesn't exist, we might need to instruct user or handle it
        // But usually it should be pre-configured
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName)

      // Update profile
      await updateProfile({ avatar: publicUrl })
      toast.success("Profile photo updated")
    } catch (error: any) {
      console.error("Unable to upload the profile image.")
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removePhoto = async () => {
    try {
      setUploading(true)
      await updateProfile({ avatar: "" }) // Set to empty string to use fallback
      toast.success("Profile photo removed")
    } catch (error: any) {
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
                {user?.avatar && !user.avatar.includes("googleusercontent.com") && (
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
