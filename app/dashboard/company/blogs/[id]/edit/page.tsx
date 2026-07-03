"use client"

import { use } from "react"

import { BlogPostForm, companyBlogCategories } from "@/components/shared/blog-post-form"

export default function EditCompanyBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <BlogPostForm
      mode="edit"
      ownerType="company"
      blogId={id}
      backHref="/dashboard/company/blogs"
      successHref="/dashboard/company/blogs"
      pageTitle="Edit Blog Post"
      pageDescription="Update your company article, cover image, and formatting"
      categories={companyBlogCategories}
    />
  )
}
