import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReactNode } from "react"

interface DashboardCardProps {
    title: string
    value: string | number
    description: string
    icon: ReactNode
    className?: string
}

export function DashboardCard({
    title,
    value,
    description,
    icon,
    className = ""
}: DashboardCardProps) {
    return (
        <Card className={`hover:shadow-lg transition-shadow duration-300 ${className} gap-2 py-4 px-4 flex flex-row items-center border-1 border-gray-200 shadow-none`}>
            {icon}
            <div className="flex flex-1 flex-col ms-4">
                <CardHeader className="px-0">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="text-2xl font-bold">{value}</div>
                </CardContent>
            </div>
        </Card>
    )
}