"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

const MAX_SOURCE_SIZE_MB = 12
const MAX_SOURCE_SIZE_BYTES = MAX_SOURCE_SIZE_MB * 1024 * 1024
const TARGET_UPLOAD_SIZE_BYTES = 900 * 1024
const IMAGE_EXTENSION_PATTERN =
  /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|tiff?|webp)$/i

interface CoverImageSelectorProps {
  value: string
  onChange: (url: string) => void
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Could not process image"))
      },
      "image/webp",
      quality
    )
  })
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("This image format could not be processed by your browser"))
    }
    image.src = objectUrl
  })
}

async function optimizeCoverImage(file: File) {
  const image = await loadImage(file)
  let maxWidth = 1800
  let maxHeight = 1000
  const qualitySteps = [0.88, 0.8, 0.72, 0.64, 0.56, 0.48]

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight)
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error("Could not process image")
    }

    context.drawImage(image, 0, 0, width, height)

    for (const quality of qualitySteps) {
      const blob = await canvasToBlob(canvas, quality)
      if (blob.size <= TARGET_UPLOAD_SIZE_BYTES || attempt === 3) return blob
    }

    maxWidth = Math.round(maxWidth * 0.78)
    maxHeight = Math.round(maxHeight * 0.78)
  }

  throw new Error("Could not optimize image")
}

export function CoverImageSelector({ value, onChange }: CoverImageSelectorProps) {
  const { user, supabase } = useAuth()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!user) {
      toast.error("Please log in before uploading a blog image")
      return
    }

    const isImage = file.type.startsWith("image/") || IMAGE_EXTENSION_PATTERN.test(file.name)
    if (!isImage) {
      toast.error("Please upload an image file")
      return
    }

    if (file.size > MAX_SOURCE_SIZE_BYTES) {
      toast.error(`Image size should be ${MAX_SOURCE_SIZE_MB}MB or smaller`)
      return
    }

    try {
      setUploading(true)
      const optimizedCover = await optimizeCoverImage(file)
      const uniqueId = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const fileName = `${user.id}/blog-cover-${uniqueId}.webp`

      const { error: uploadError } = await supabase.storage
        .from("blog-covers")
        .upload(fileName, optimizedCover, {
          cacheControl: "31536000",
          contentType: "image/webp",
          upsert: true,
        })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("blog-covers").getPublicUrl(fileName)

      onChange(publicUrl)
      toast.success("Blog cover image optimized and uploaded")
    } catch (error: any) {
      console.error("Error uploading blog cover:", error)
      toast.error(error.message || "Failed to upload image")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-medium">Cover Image</Label>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onChange("")}
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </Button>
        ) : null}
      </div>

      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg border bg-muted shadow-inner">
        {value ? (
          <Image
            src={value}
            alt="Blog cover preview"
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImagePlus className="h-10 w-10 opacity-30" />
            <p className="text-xs">Upload a custom blog cover image</p>
          </div>
        )}
      </div>

      <Card
        className={cn(
          "cursor-pointer border-dashed transition-colors hover:border-primary/50 hover:bg-primary/[0.03]",
          value ? "border-primary/40 bg-primary/[0.02]" : ""
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center px-5 py-6 text-center">
          {uploading ? (
            <>
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Uploading image...</p>
            </>
          ) : (
            <>
              <UploadCloud className="mb-2 h-8 w-8 text-primary" />
              <p className="text-sm font-medium">
                {value ? "Replace cover image" : "Upload cover image"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supports common image formats up to {MAX_SOURCE_SIZE_MB}MB
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.avif,.bmp,.gif,.heic,.heif,.jpg,.jpeg,.png,.svg,.tif,.tiff,.webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
