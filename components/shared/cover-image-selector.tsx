"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ImagePlus, Loader2, X, Check } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { cn } from "@/lib/utils"

// Hardcoded default cover images
const DEFAULT_COVERS = [
  {
    id: "default-1",
    url: "https://images.unsplash.com/photo-1434031213662-874396ca9d1e?q=80&w=1000&auto=format&fit=crop",
    label: "Study Desk",
  },
  {
    id: "default-2",
    url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop",
    label: "Library",
  },
  {
    id: "default-3",
    url: "https://images.unsplash.com/photo-1523050335392-93851179ae22?q=80&w=1000&auto=format&fit=crop",
    label: "Graduation",
  },
  {
    id: "default-4",
    url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop",
    label: "Digital Learning",
  },
  {
    id: "default-5",
    url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1000&auto=format&fit=crop",
    label: "Education Architecture",
  },
  {
    id: "default-6",
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop",
    label: "Collaboration",
  },
]

// The default fallback if none is chosen
export const FALLBACK_COVER = "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?q=80&w=1000&auto=format&fit=crop"

interface CoverImageSelectorProps {
  value: string
  onChange: (url: string) => void
}

export function CoverImageSelector({ value, onChange }: CoverImageSelectorProps) {
  const { user, supabase } = useAuth()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    const allowedTypes = ["image/webp", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a WebP or PNG image file")
      return
    }

    // Validate file size (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      toast.error("Image size should be less than 1MB")
      return
    }

    try {
      setUploading(true)
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage (blog-covers bucket)
      const { error: uploadError } = await supabase.storage
        .from("blog-covers")
        .upload(fileName, file, {
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("blog-covers")
        .getPublicUrl(fileName)

      onChange(publicUrl)
      toast.success("Cover image uploaded")
    } catch (error: any) {
      console.error("Error uploading cover:", error)
      toast.error(error.message || "Failed to upload image")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const isCustom = value && !DEFAULT_COVERS.some(c => c.url === value) && value !== FALLBACK_COVER

  return (
    <div className="flex flex-col gap-4">
      <Label className="text-sm font-medium">Cover Image (Optional)</Label>
      
      {/* Current Selection Preview */}
      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg border bg-muted shadow-inner group">
        {value ? (
          <>
            <Image
              src={value}
              alt="Cover preview"
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 scale-90 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100"
              onClick={() => onChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <ImagePlus className="mb-2 h-10 w-10 opacity-20" />
            <p className="text-xs">No cover image selected. Using default.</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Default Options */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Choose from defaults
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEFAULT_COVERS.map((cover) => (
              <button
                key={cover.id}
                type="button"
                className={cn(
                  "relative aspect-video overflow-hidden rounded-md border-2 transition-all hover:opacity-80",
                  value === cover.url ? "border-primary ring-2 ring-primary/20" : "border-transparent"
                )}
                onClick={() => onChange(cover.url)}
              >
                <Image
                  src={cover.url}
                  alt={cover.label}
                  fill
                  className="object-cover"
                />
                {value === cover.url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                    <Check className="h-5 w-5 text-white drop-shadow-md" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Upload */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Upload custom
          </p>
          <Card 
            className={cn(
              "cursor-pointer border-dashed transition-colors hover:bg-accent/50",
              isCustom ? "border-primary bg-primary/[0.02]" : ""
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-6 text-center">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <>
                  <ImagePlus className={cn("mb-2 h-8 w-8", isCustom ? "text-primary" : "text-muted-foreground")} />
                  <p className="text-sm font-medium">
                    {isCustom ? "Change custom image" : "Upload from device"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, PNG up to 5MB
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}
