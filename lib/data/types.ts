export type UserType = "student" | "university" | "company" | "admin"

export interface User {
  id: string
  name: string
  email: string
  type: UserType
  organization?: string
  bio?: string
  avatar?: string
  createdAt: string
  welcomeEmailSent?: boolean
  isVerified?: boolean
  verifiedAt?: string
  verifiedBy?: string
  verificationNote?: string
  verificationBadge?: "verified" | "trusted" | "featured"
}

export type ThesisType = "master" | "phd"
export type ApprovalStatus = "approved" | "pending" | "rejected"
export type Compensation = "paid" | "unpaid" | "stipend"

export interface Thesis {
  id: string
  title: string
  type: ThesisType
  description: string
  subject: string
  organization: string
  organizationType: "university" | "company"
  location: string
  compensation: Compensation
  deadline: string
  postedBy: "university" | "company" | "admin"
  postedByUserId: string | null
  externalUrl: string
  status: ApprovalStatus
  createdAt: string
  creatorName?: string
  creatorType?: string
  organizationVerified?: boolean
  verificationBadge?: "verified" | "trusted" | "featured"
}

export interface TraineeProgram {
  id: string
  title: string
  company: string
  description: string
  field: string
  location: string
  duration: string
  compensation: Compensation
  deadline: string
  postedBy: "company" | "admin"
  postedByUserId: string | null
  externalUrl: string
  status: ApprovalStatus
  createdAt: string
  organizationVerified?: boolean
  verificationBadge?: "verified" | "trusted" | "featured"
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  category: string
  coverImage?: string | null
  createdAt: string
  readTime: string
  status: ApprovalStatus
  postedByUserId?: string | null
  authorAvatar?: string
}

export interface BlogComment {
  id: string
  blogPostId: string
  userId?: string
  authorName: string
  authorEmail?: string
  content: string
  status: ApprovalStatus
  isAnonymous: boolean
  createdAt: string
  postTitle?: string
  postSlug?: string
}

export interface Testimonial {
  id: string
  author: string
  role: UserType
  organization?: string
  content: string
  rating: number
  status: ApprovalStatus
  createdAt: string
  userId?: string
  avatar?: string
  previousVersionId?: string
}
