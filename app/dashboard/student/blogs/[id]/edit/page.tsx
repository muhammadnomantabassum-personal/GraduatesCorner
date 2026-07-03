"use client"

import { use } from "react"

import { BlogPostForm, studentBlogCategories } from "@/components/shared/blog-post-form"

export default function EditStudentBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <BlogPostForm
      mode="edit"
      ownerType="student"
      blogId={id}
      backHref="/dashboard/student/blogs"
      successHref="/dashboard/student/blogs"
      pageTitle="Edit Blog Post"
      pageDescription="Update your article, cover image, and formatting"
      categories={studentBlogCategories}
    />
  )
}
