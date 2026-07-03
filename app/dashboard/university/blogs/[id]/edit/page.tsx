"use client"

import { use } from "react"

import { BlogPostForm, universityBlogCategories } from "@/components/shared/blog-post-form"

export default function EditUniversityBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <BlogPostForm
      mode="edit"
      ownerType="university"
      blogId={id}
      backHref="/dashboard/university/blogs"
      successHref="/dashboard/university/blogs"
      pageTitle="Edit Blog Post"
      pageDescription="Update your university article, cover image, and formatting"
      categories={universityBlogCategories}
    />
  )
}
