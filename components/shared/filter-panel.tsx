"use client"

import { useState, useMemo } from "react"
import { ChevronDown, Check, Search, X } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FilterOption {
  value: string
  label: string
  count?: number
  children?: FilterOption[]
}

export interface FilterSection {
  id: string
  label: string
  type: "checkbox" | "location"
  options: FilterOption[]
  maxVisible?: number
}

export interface FilterPanelProps {
  sections: FilterSection[]
  selected: Record<string, string[]>
  onToggle: (sectionId: string, value: string) => void
  onClearAll: () => void
  activeCount: number
}

/* ------------------------------------------------------------------ */
/*  FilterPanel                                                        */
/* ------------------------------------------------------------------ */

export function FilterPanel({
  sections,
  selected,
  onToggle,
  onClearAll,
  activeCount,
}: FilterPanelProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[14px] font-semibold text-foreground">Filters</h3>
          {activeCount > 0 && (
            <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold leading-none text-primary-foreground">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onClearAll}
            className="text-[12px] font-medium text-accent transition-colors hover:text-accent/70"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sections */}
      {sections.map((section, index) => (
        <SectionBlock
          key={section.id}
          section={section}
          selected={selected[section.id] || []}
          onToggle={(value) => onToggle(section.id, value)}
          isFirst={index === 0}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section block                                                      */
/* ------------------------------------------------------------------ */

function SectionBlock({
  section,
  selected,
  onToggle,
  isFirst,
}: {
  section: FilterSection
  selected: string[]
  onToggle: (value: string) => void
  isFirst: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [locationSearch, setLocationSearch] = useState("")
  const maxVisible = section.maxVisible ?? 5

  /* Filter location options by search */
  const filteredOptions = useMemo(() => {
    if (section.type !== "location" || !locationSearch) return section.options
    const q = locationSearch.toLowerCase()
    return section.options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.children?.some((c) => c.label.toLowerCase().includes(q))
    )
  }, [section, locationSearch])

  const visibleOptions = showAll ? filteredOptions : filteredOptions.slice(0, maxVisible)
  const hiddenCount = filteredOptions.length - maxVisible

  return (
    <div className="border-t border-border/60">
      {/* Section header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-3 transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-foreground">
            {section.label}
          </span>
          {selected.length > 0 && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent/15 px-1 text-[10px] font-bold text-accent">
              {selected.length}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${expanded ? "" : "-rotate-90"
            }`}
        />
      </button>

      {/* Section content */}
      {expanded && (
        <div className="px-3 pb-4">
          {/* Location search */}
          {section.type === "location" && (
            <div className="mx-1 mb-2.5 flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-[7px]">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Search countries or cities..."
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="w-full bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
              {locationSearch && (
                <button onClick={() => setLocationSearch("")}>
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          )}

          {/* Options */}
          <div className="flex flex-col">
            {section.type === "location"
              ? visibleOptions.map((opt) => (
                <LocationGroup
                  key={opt.value}
                  option={opt}
                  selected={selected}
                  onToggle={onToggle}
                  searchQuery={locationSearch}
                />
              ))
              : visibleOptions.map((opt) => (
                <CheckboxRow
                  key={opt.value}
                  label={opt.label}
                  count={opt.count}
                  checked={selected.includes(opt.value)}
                  onChange={() => onToggle(opt.value)}
                />
              ))}
          </div>

          {/* Show more / less */}
          {hiddenCount > 0 && !locationSearch && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="ml-2 mt-1.5 text-[12px] font-medium text-accent transition-colors hover:text-accent/70"
            >
              {showAll ? "Show less" : `+${hiddenCount} more`}
            </button>
          )}

          {/* No results */}
          {filteredOptions.length === 0 && locationSearch && (
            <p className="px-2 py-2 text-[12px] text-muted-foreground">
              No locations match &ldquo;{locationSearch}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Location group (country → cities)                                  */
/* ------------------------------------------------------------------ */

function LocationGroup({
  option,
  selected,
  onToggle,
  searchQuery,
}: {
  option: FilterOption
  selected: string[]
  onToggle: (value: string) => void
  searchQuery: string
}) {
  const [expanded, setExpanded] = useState(false)
  const isCountrySelected = selected.includes(option.value)
  const hasCities = option.children && option.children.length > 0

  /* Auto-expand when searched and children match */
  const filteredChildren = useMemo(() => {
    if (!option.children) return []
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return option.children.filter((c) => c.label.toLowerCase().includes(q))
    }
    return option.children
  }, [option.children, searchQuery])

  const shouldExpand =
    expanded || (!!searchQuery && filteredChildren.length > 0)

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        {/* Expand chevron — cities list opens BELOW (downward) */}
        {hasCities ? (
          <button
            onClick={() => setExpanded(!expanded)}
            title={shouldExpand ? "Collapse cities" : "Expand cities"}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted/50"
          >
            <ChevronDown
              className={`h-3 w-3 text-muted-foreground/70 transition-transform duration-200 ${shouldExpand ? "" : "-rotate-90"
                }`}
            />
          </button>
        ) : (
          <div className="w-7" />
        )}

        {/* Country checkbox */}
        <div className="flex-1">
          <CheckboxRow
            label={option.label}
            count={option.count}
            checked={isCountrySelected}
            onChange={() => onToggle(option.value)}
          />
        </div>
      </div>

      {/* Cities — always expands downward, no absolute positioning */}
      {shouldExpand && filteredChildren.length > 0 && (
        <div className="ml-7 border-l border-border/40 pl-1">
          {filteredChildren.map((child) => (
            <CheckboxRow
              key={child.value}
              label={child.label}
              count={child.count}
              checked={selected.includes(child.value)}
              onChange={() => onToggle(child.value)}
              indent
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  CheckboxRow                                                        */
/* ------------------------------------------------------------------ */

function CheckboxRow({
  label,
  count,
  checked,
  onChange,
  indent,
}: {
  label: string
  count?: number
  checked: boolean
  onChange: () => void
  indent?: boolean
}) {
  return (
    <label
      className={`group flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-[6px] transition-colors hover:bg-muted/40 ${indent ? "py-[5px]" : ""
        }`}
    >
      {/* Custom checkbox */}
      <span
        className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-[4px] border transition-all duration-150 ${checked
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : "border-border bg-background group-hover:border-primary/40"
          }`}
      >
        {checked && <Check className="h-[10px] w-[10px]" strokeWidth={3} />}
      </span>

      {/* Label */}
      <span
        className={`flex-1 truncate text-[13px] leading-tight ${checked
            ? "font-medium text-foreground"
            : "text-muted-foreground group-hover:text-foreground"
          }`}
      >
        {label}
      </span>

      {/* Count */}
      {count !== undefined && count > 0 && (
        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/50">
          {count}
        </span>
      )}

      {/* Hidden native checkbox */}
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
    </label>
  )
}
