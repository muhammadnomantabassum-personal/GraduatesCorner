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
  postedByUserId: string
  externalUrl: string
  status: ApprovalStatus
  createdAt: string
  creatorName?: string
  creatorType?: string
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
  postedByUserId: string
  externalUrl: string
  status: ApprovalStatus
  createdAt: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  category: string
  coverImage: string
  createdAt: string
  readTime: string
  status: ApprovalStatus
  postedByUserId?: string
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
  previousVersionId?: string
}
