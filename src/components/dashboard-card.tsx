import { Card } from "@/components/ui/card"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface DashboardCardProps {
  title: string
  value: string | number
  icon: ReactNode
  className?: string
  onClick?: () => void
}

export function DashboardCard({
  title,
  value,
  icon,
  className = "",
  onClick,
}: DashboardCardProps) {
  return (
    <Card
      className={cn(
        "flex items-center gap-3 p-3 border-1 border-gray-200 shadow-none flex-row",
        "hover:shadow-md transition-shadow",
        onClick && "cursor-pointer hover:bg-gray-50",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-center h-10 w-10 rounded-md">
        {icon}
      </div>

      <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-500 tracking-wide">
          {title}
        </span>
        <span className="text-2xl font-semibold leading-tight">
          {value}
        </span>
      </div>
    </Card>
  )
}