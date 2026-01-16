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
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header - cleaner spacing and typography */}
      <div className={cn(
        "px-5 bg-gradient-to-br from-white to-gray-50/30",
        isDominant ? "pt-5 pb-4" : "pt-4 pb-3"
      )}>
        <div className="flex items-center gap-1.5 mb-1">
          <h3 className={cn(
            "font-semibold text-gray-700",
            isDominant ? "text-sm tracking-wide uppercase" : "text-xs tracking-wide uppercase"
          )}>
            {title}
          </h3>
          <InfoTooltip description={description} />
        </div>
        <div className="flex items-baseline gap-2.5">
          <span className={cn(
            "font-bold text-gray-900 tracking-tight",
            isDominant ? "text-4xl" : "text-3xl"
          )}>
            {formatNumber(value)}
          </span>
          <Delta value={delta} />
        </div>
      </div>

      {/* Desktop - grid layout */}
      <div
        className={cn(
          "hidden md:grid border-t border-gray-100 bg-white",
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

      {/* Mobile - stacked layout with fixed heights */}
      <div className="md:hidden border-t border-gray-100 bg-white">
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