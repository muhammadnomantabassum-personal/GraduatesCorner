import Image from "next/image"

import { cn } from "@/lib/utils"

type BlogCoverImageProps = {
  src: string
  alt: string
  className?: string
  priority?: boolean
  sizes?: string
  loading?: "lazy" | "eager"
}

export function BlogCoverImage({
  src,
  alt,
  className,
  priority,
  sizes,
  loading,
}: BlogCoverImageProps) {
  if (src.startsWith("data:")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn("absolute inset-0 h-full w-full", className)}
        loading={loading}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      priority={priority}
      loading={priority ? undefined : loading}
      sizes={sizes}
      className={className}
    />
  )
}
