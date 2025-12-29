"use client"
import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { Label, Legend, Pie, PieChart } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const defaultChartData = [
  { gender: "male", applications: 450, fill: "#3b82f6" },
  { gender: "female", applications: 380, fill: "#ec4899" },
  { gender: "prefer-not-to-say", applications: 120, fill: "#9ca3af" },
]

const chartConfig = {
  applications: {
    label: "Applications",
  },
  male: {
    label: "Male",
    color: "#3b82f6",
  },
  female: {
    label: "Female",
    color: "#ec4899",
  },
  "prefer-not-to-say": {
    label: "I prefer NOT TO say",
    color: "#9ca3af",
  },
} satisfies ChartConfig

interface GenderDistributionChartProps {
  demographics?: {
    gender_distribution?: {
      gender: string;
      applications: number;
      fill: string;
    }[];
  };
}

export default function GenderDistributionChart({ demographics }: GenderDistributionChartProps) {
  const chartData = demographics?.gender_distribution && demographics.gender_distribution.length > 0 
    ? demographics.gender_distribution 
    : defaultChartData;
  
  const totalApplications = React.useMemo(() => {
    return chartData.reduce((acc: number, curr: { applications: number }) => acc + curr.applications, 0)
  }, [chartData])

  type DataKeyFunction<T = Record<string, unknown>> = (data: T) => string | number;
  
  const renderLegend = (props: { payload?: Array<{
    value?: string;
    color?: string;
    id?: string;
    type?: string;
    dataKey?: string | number | DataKeyFunction;
  }> }) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center" style={{ paddingTop: "20px" }}>
        {payload?.map((entry: {
          value?: string;
          color?: string;
          id?: string;
          type?: string;
          dataKey?: string | number | DataKeyFunction;
        }, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground capitalize">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="shadow-none ">
      <CardHeader className="items-center pb-0">
        <CardTitle>Gender Distribution</CardTitle>
        <CardDescription>Application Demographics</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="applications"
              nameKey="gender"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalApplications.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Applications
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
            <Legend content={renderLegend} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}