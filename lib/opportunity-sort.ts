export type OpportunitySort = "recommended" | "deadline" | "newest" | "funded"

type SortableOpportunity = {
  compensation: string
  deadline: string
  createdAt: string
  isFeatured?: boolean
  organizationVerified?: boolean
  postedBy?: string
}

function timestamp(value: string) {
  const result = new Date(value).getTime()
  return Number.isNaN(result) ? Number.POSITIVE_INFINITY : result
}

function recommendationScore(item: SortableOpportunity) {
  const verified = item.organizationVerified || item.postedBy === "admin"
  const funded = item.compensation === "paid" || item.compensation === "stipend"
  const deadline = timestamp(item.deadline)
  const daysRemaining = (deadline - Date.now()) / 86_400_000

  return (
    (item.isFeatured ? 40 : 0) +
    (verified ? 24 : 0) +
    (funded ? 18 : 0) +
    (daysRemaining >= 0 && daysRemaining <= 45 ? 12 : daysRemaining > 45 ? 6 : 0)
  )
}

export function sortOpportunityResults<T extends SortableOpportunity>(items: T[], sort: OpportunitySort) {
  return [...items].sort((left, right) => {
    if (sort === "deadline") return timestamp(left.deadline) - timestamp(right.deadline)
    if (sort === "newest") return timestamp(right.createdAt) - timestamp(left.createdAt)
    if (sort === "funded") {
      const leftFunded = left.compensation === "paid" || left.compensation === "stipend" ? 1 : 0
      const rightFunded = right.compensation === "paid" || right.compensation === "stipend" ? 1 : 0
      return rightFunded - leftFunded || timestamp(left.deadline) - timestamp(right.deadline)
    }

    return recommendationScore(right) - recommendationScore(left) || timestamp(left.deadline) - timestamp(right.deadline)
  })
}
