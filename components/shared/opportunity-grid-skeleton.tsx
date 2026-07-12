import { Skeleton } from "@/components/ui/skeleton"

export function OpportunityGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2" aria-label="Loading opportunities" aria-busy="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="min-h-[410px] overflow-hidden rounded-lg border border-border bg-card p-5 shadow-sm">
          <Skeleton className="mb-5 h-1.5 w-full" />
          <div className="mb-4 flex items-center justify-between gap-3">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-7 w-20" />
          </div>
          <Skeleton className="h-6 w-11/12" />
          <Skeleton className="mt-2 h-6 w-3/4" />
          <Skeleton className="mt-5 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
          <Skeleton className="mt-5 h-20 w-full" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="mt-7 flex items-center justify-between">
            <div className="flex gap-1"><Skeleton className="h-9 w-9" /><Skeleton className="h-9 w-9" /></div>
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      ))}
    </div>
  )
}
