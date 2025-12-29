"use client"
import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "An area chart showing applications per day"

const defaultChartData = [
  { date: "Mon", applications: 45 },
  { date: "Tue", applications: 52 },
  { date: "Wed", applications: 38 },
  { date: "Thu", applications: 61 },
  { date: "Fri", applications: 48 },
  { date: "Sat", applications: 29 },
  { date: "Sun", applications: 33 },
]

const chartConfig = {
  applications: {
    label: "Applications",
    color: "hsl(221, 83%, 53%)",
  },
} satisfies ChartConfig

interface ApplicationsPerDayChartProps {
  funnelData?: {
    stage: string;
    total?: number;
    passed?: number;
    failed?: number;
    appealed?: number;
    suspended?: number;
    stageTotal?: number;
    completed?: number;
    scheduled?: number;
    hired?: number;
    accepted?: number;
    declined?: number;
  }[];
}

export function ApplicationsPerDayChart({ funnelData }: ApplicationsPerDayChartProps) {
  const chartData = funnelData && funnelData.length > 0 ? 
    funnelData.map((item: { stage: string; stageTotal?: number }, index: number) => ({
      date: item.stage || `Day ${index + 1}`,
      applications: item.stageTotal || 0
    })) : defaultChartData;
  
  const totalApplications = chartData.reduce((sum: number, day: { applications: number }) => sum + day.applications, 0)
  const avgPerDay = (totalApplications / chartData.length).toFixed(1)

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Applications Per Day</CardTitle>
        <CardDescription>
          Daily application submissions for the current week
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillApplications" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-applications)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-applications)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="applications"
              type="natural"
              fill="url(#fillApplications)"
              fillOpacity={0.4}
              stroke="var(--color-applications)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      
    </Card>
  )
}