import * as React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type MetricItem = {
  key: string
  label: string
  description?: string
  value: number
  delta?: number
}

export type MetricCardProps = {
  title: string
  description?: string
  value: number
  delta?: number
  items: MetricItem[]
  variant?: "default" | "dominant"
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return value.toString()
}

function Delta({ value }: { value?: number }) {
  if (typeof value !== "number" || value === 0) return null
  const isNegative = value < 0
  return (
    <span
      className={cn(
        "text-sm font-medium",
        isNegative ? "text-red-500" : "text-green-600"
      )}
    >
      {isNegative ? "▼" : "▲"} {Math.abs(value)}%
    </span>
  )
}

function InfoTooltip({ description }: { description?: string }) {
  if (!description) return null
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default text-muted-foreground text-xs">ⓘ</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function MetricItemBlock({
  item,
  showDivider
}: {
  item: MetricItem
  showDivider: boolean
}) {
  return (
    <div className="relative flex h-full w-full">
      {/* Softer divider */}
      {showDivider && (
        <div className="absolute right-0 top-0 h-full w-px bg-gray-200/40" />
      )}
      <div className="flex flex-col justify-between px-4 py-3 w-full">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-muted-foreground">
            {item.label}
          </span>
          <InfoTooltip description={item.description} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xl font-semibold text-black">
            {formatNumber(item.value)}
          </span>
          <Delta value={item.delta} />
        </div>
      </div>
    </div>
  )
}

export function MetricCard({
  title,
  description,
  value,
  delta,
  items,
  variant = "default"
}: MetricCardProps) {
  const columnCount = Math.min(items.length, 4)
  const isDominant = variant === "dominant"
  
  return (
    <div className="rounded-xl border bg-white flex flex-col">
      {/* Header - dominant variant has more emphasis */}
      <div className={cn(
        "px-6",
        isDominant ? "pt-6 pb-4" : "pt-4 pb-1"
      )}>
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-medium text-muted-foreground",
            isDominant ? "text-base" : "text-sm"
          )}>
            {title}
          </h3>
          <InfoTooltip description={description} />
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className={cn(
            "font-bold text-black",
            isDominant ? "text-5xl" : "text-4xl"
          )}>
            {formatNumber(value)}
          </span>
          <Delta value={delta} />
        </div>
      </div>

      {/* Desktop */}
      <div
        className={cn(
          "hidden md:grid border-t border-gray-200/40 flex-1 items-stretch",
          "grid-auto-rows-fr",
          columnCount === 1 && "grid-cols-1",
          columnCount === 2 && "grid-cols-2",
          columnCount === 3 && "grid-cols-3",
          columnCount >= 4 && "grid-cols-4"
        )}
      >
        {items.map((item, index) => (
          <MetricItemBlock
            key={item.key}
            item={item}
            showDivider={index < columnCount - 1}
          />
        ))}
      </div>

      {/* Mobile */}
      <div className="md:hidden border-t border-gray-200/40 divide-y divide-gray-200/40">
        {items.map(item => (
          <MetricItemBlock
            key={item.key}
            item={item}
            showDivider={false}
          />
        ))}
      </div>
    </div>
  )
}