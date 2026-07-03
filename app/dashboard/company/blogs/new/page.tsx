"use client"

import { BlogPostForm, companyBlogCategories } from "@/components/shared/blog-post-form"

export default function NewCompanyBlogPage() {
  return (
    <BlogPostForm
      mode="create"
      ownerType="company"
      backHref="/dashboard/company/blogs"
      successHref="/dashboard/company/blogs"
      pageTitle="Write a Blog Post"
      pageDescription="Share industry insights, career advice, or company news"
      categories={companyBlogCategories}
    />
  )
}
