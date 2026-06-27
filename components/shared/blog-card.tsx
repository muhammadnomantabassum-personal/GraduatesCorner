import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, ArrowRight, Image as ImageIcon } from "lucide-react"
import type { BlogPost } from "@/lib/data/types"

// A transparent 1x1 pixel base64 for better placeholder performance
const blurDataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

export function BlogCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  const blogLink = `/blog/${post.slug || post.id}`

  if (featured) {
    return (
      <Card className="overflow-hidden border-border/70 bg-card/92 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_22px_55px_rgba(66,133,244,0.14)]">
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-video bg-secondary md:aspect-auto md:min-h-[280px]">
            {post.coverImage ? (
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                priority={true} // Featured image is always above the fold
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                placeholder="blur"
                blurDataURL={blurDataURL}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="h-12 w-12" />
                <span className="text-sm">Featured Article</span>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center p-6">
            <Badge variant="outline" className="mb-3 w-fit">{post.category}</Badge>
            <Link href={blogLink}>
              <h2 className="mb-3 text-balance text-2xl font-bold text-foreground transition-colors hover:text-primary">
                {post.title}
              </h2>
            </Link>
            <p className="mb-4 leading-relaxed text-muted-foreground">{post.excerpt}</p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 min-w-0">
                  {post.authorAvatar ? (
                    <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full">
                      <Image src={post.authorAvatar} alt={post.author} fill className="object-cover" />
                    </div>
                  ) : (
                    <User className="h-4 w-4 text-primary/70" />
                  )}
                  <span className="truncate">{post.author}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
              </div>
              <Link href={blogLink}>
                <Button size="sm" className="w-fit gap-2">
                  Read Blog
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col overflow-hidden border-border/70 bg-card/92 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_22px_55px_rgba(66,133,244,0.14)]">
      <div className="relative aspect-video bg-secondary">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            loading="lazy"
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL={blurDataURL}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <Badge variant="outline" className="w-fit text-xs">{post.category}</Badge>
        <Link href={blogLink}>
          <h3 className="text-balance text-lg font-semibold leading-tight text-foreground transition-colors hover:text-primary">
            {post.title}
          </h3>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 pt-0">
        <div className="flex w-full items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 min-w-0">
              {post.authorAvatar ? (
                <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full font-bold">
                  <Image src={post.authorAvatar} alt={post.author} fill className="object-cover" />
                </div>
              ) : (
                <User className="h-3 w-3 text-primary/70" />
              )}
              <span className="truncate">{post.author}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(post.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.readTime}
          </span>
        </div>
        <Link href={blogLink} className="w-full">
          <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
            Read Blog
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
