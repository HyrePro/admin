// components/kpi-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function KPICard({
  title,
  value,
  sub
}: {
  title: string
  value: string | number
  sub?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}
