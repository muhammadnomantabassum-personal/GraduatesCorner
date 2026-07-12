"use client"

import { ArrowUpDown } from "lucide-react"
import type { OpportunitySort } from "@/lib/opportunity-sort"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function OpportunitySortSelect({ value, onChange }: { value: OpportunitySort; onChange: (value: OpportunitySort) => void }) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
      <Select value={value} onValueChange={(next) => onChange(next as OpportunitySort)}>
        <SelectTrigger className="w-[9.75rem] bg-background" aria-label="Sort opportunities">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="recommended">Recommended</SelectItem>
          <SelectItem value="deadline">Deadline soon</SelectItem>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="funded">Funded first</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
