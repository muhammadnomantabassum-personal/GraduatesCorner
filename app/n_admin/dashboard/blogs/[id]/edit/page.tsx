"use client"

import { use } from "react"

import { BlogPostForm, adminBlogCategories } from "@/components/shared/blog-post-form"

export default function AdminEditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <BlogPostForm
      mode="edit"
      ownerType="admin"
      blogId={id}
      backHref="/n_admin/dashboard/blogs"
      successHref="/n_admin/dashboard/blogs"
      pageTitle="Edit Blog Post"
      pageDescription="Update any community or official blog post"
      categories={adminBlogCategories}
    />
  )
}
