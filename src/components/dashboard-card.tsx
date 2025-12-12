import { Card } from "@/components/ui/card"
import { ReactNode } from "react"

interface DashboardCardProps {
  title: string
  value: string | number
  icon: ReactNode
  className?: string
}

export function DashboardCard({
  title,
  value,
  icon,
  className = "",
}: DashboardCardProps) {
  return (
    <Card
      className={[
        "flex items-center gap-3 p-3 border-1 border-gray-200 shadow-none flex-row",
        "hover:shadow-md transition-shadow",
        className,
      ].join(" ")}
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