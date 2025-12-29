"use client"
import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
  { date: "1 Jan", applications: 45 },
  { date: "2 Feb", applications: 52 },
  { date: "3 Mar", applications: 38 },
  { date: "4 Apr", applications: 61 },
  { date: "5 May", applications: 48 },
  { date: "6 Jun", applications: 29 },
  { date: "7 Jul", applications: 33 },
]

const chartConfig = {
  applications: {
    label: "Applications",
    color: "hsl(221, 83%, 53%)",
  },
} satisfies ChartConfig

interface ApplicationsPerDayChartProps {
  timelineData?: {
    period: string;
    label: string;
    applications: number;
  }[];
  periodType?: string;
}

export function ApplicationsPerDayChart({ timelineData, periodType }: ApplicationsPerDayChartProps) {
  // Determine the label based on period type
  const periodLabel = periodType === 'monthly' ? 'Month' : periodType === 'daily' ? 'Day' : 'Period';
  
  const chartData = timelineData && timelineData.length > 0 ? 
    timelineData.map((item, index) => ({
      // Format date based on period type
      date: item.label || (
        periodType === 'monthly' 
          ? new Date(item.period).toLocaleDateString('default', { day: 'numeric', month: 'short' }) 
          : periodType === 'daily'
          ? new Date(item.period).toLocaleDateString('default', { day: 'numeric', month: 'short' })
          : `${periodLabel} ${index + 1}`
      ),
      applications: Math.max(0, item.applications || 0) // Ensure non-negative values
    })) : defaultChartData;
  


  const totalApplications = chartData.reduce((sum: number, day: { applications: number }) => sum + day.applications, 0);
  const avgPerPeriod = totalApplications > 0 && chartData.length > 0 ? (totalApplications / chartData.length).toFixed(1) : '0.0';
  
  // Find peak period
  const peakPeriod = chartData.length > 0 ? chartData.reduce((max, current) => 
    (current.applications > max.applications) ? current : max
  ) : null;
  
  // Calculate percentage change compared to previous periods if available
  const isIncreasing = chartData.length >= 2 && chartData[chartData.length - 1].applications > chartData[chartData.length - 2].applications;
  
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Applications Per {periodType === 'monthly' ? 'Month' : periodType === 'daily' ? 'Day' : 'Period'}</CardTitle>
        <CardDescription>
          Application submissions based on {periodType || 'selected'} time period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-1">
            <ChartContainer config={chartConfig}>
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                  top: 10,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  domain={[0, 'auto']}
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
          </div>
          
          {/* Information Cards Section - matches hiring funnel layout */}
          <div className="lg:col-span-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total Applications - First */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium">Total Applications</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {totalApplications}
                </p>
                <p className="text-sm text-gray-500">across all {periodType || 'periods'}</p>
              </div>
              
              {/* Average Per Period */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium">Average per {periodType === 'monthly' ? 'Month' : periodType === 'daily' ? 'Day' : 'Period'}</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {avgPerPeriod}
                </p>
                <p className="text-sm text-gray-500">per time period</p>
              </div>
              
              {/* Peak Period */}
              {peakPeriod && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium">Peak Period</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {peakPeriod.applications}
                  </p>
                  <p className="text-sm text-gray-500">on {peakPeriod.date}</p>
                </div>
              )}
              
              {/* Trend Indicator */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium">Trend</h3>
                <p className={`text-2xl font-bold ${isIncreasing ? 'text-green-600' : 'text-red-600'}`}>
                  {isIncreasing ? '↑ Increasing' : '↓ Decreasing'}
                </p>
                <p className="text-sm text-gray-500">latest period</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}