"use client"
import { Users } from "lucide-react"
import * as RechartsPrimitive from "recharts"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const defaultChartData = [
  { 
    stage: "Applications",
    total: 500,
    stageTotal: 500,
  },
  { 
    stage: "Assessment",
    passed: 320,
    failed: 80,
    appealed: 30,
    suspended: 20,
    stageTotal: 450,
  },
  { 
    stage: "Demo Round",
    passed: 250,
    failed: 40,
    appealed: 20,
    suspended: 10,
    stageTotal: 320,
  },
  { 
    stage: "Interview",
    completed: 210,
    scheduled: 20,
    stageTotal: 230,
  },
  { 
    stage: "Offered",
    hired: 145,
    accepted: 5,
    declined: 30,
    stageTotal: 180,
  },
]

const chartConfig = {
  total: {
    label: "Total Applications",
    color: "hsl(217 91% 60%)",
  },
  passed: {
    label: "Passed",
    color: "hsl(142 76% 36%)",
  },
  failed: {
    label: "Failed",
    color: "hsl(0 84% 60%)",
  },
  appealed: {
    label: "Appealed",
    color: "hsl(45 93% 47%)",
  },
  suspended: {
    label: "Suspended",
    color: "hsl(240 5% 65%)",
  },
  scheduled: {
    label: "Scheduled",
    color: "hsl(221 83% 53%)",
  },
  completed: {
    label: "Completed",
    color: "hsl(142 76% 45%)",
  },
  accepted: {
    label: "Accepted (Pending)",
    color: "hsl(200 76% 45%)",
  },
  declined: {
    label: "Declined",
    color: "hsl(0 84% 60%)",
  },
  hired: {
    label: "Hired",
    color: "hsl(142 71% 45%)",
  },
} satisfies ChartConfig

interface HiringFunnelChartProps {
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

export default function HiringFunnelChart({ funnelData }: HiringFunnelChartProps) {
  // Process the data to calculate unaccounted values so each bar totals to stageTotal
  const processedData = (funnelData && funnelData.length > 0 ? funnelData : defaultChartData).map(stage => {
    const { stageTotal, total, passed, failed, appealed, suspended, completed, scheduled, hired, accepted, declined, ...rest } = stage;
    
    // Calculate sum of all known values
    let knownValuesSum = 0;
    if (typeof total === 'number') knownValuesSum += total;
    if (typeof passed === 'number') knownValuesSum += passed;
    if (typeof failed === 'number') knownValuesSum += failed;
    if (typeof appealed === 'number') knownValuesSum += appealed;
    if (typeof suspended === 'number') knownValuesSum += suspended;
    if (typeof completed === 'number') knownValuesSum += completed;
    if (typeof scheduled === 'number') knownValuesSum += scheduled;
    if (typeof hired === 'number') knownValuesSum += hired;
    if (typeof accepted === 'number') knownValuesSum += accepted;
    if (typeof declined === 'number') knownValuesSum += declined;
    
    // Calculate unaccounted value (what's left to reach stageTotal)
    const unaccounted = typeof stageTotal === 'number' ? stageTotal - knownValuesSum : 0;
    
    return {
      ...rest,
      stage,
      stageTotal,
      total: total || 0,
      passed: passed || 0,
      failed: failed || 0,
      appealed: appealed || 0,
      suspended: suspended || 0,
      completed: completed || 0,
      scheduled: scheduled || 0,
      hired: hired || 0,
      accepted: accepted || 0,
      declined: declined || 0,
      unaccounted: Math.max(0, unaccounted), // Ensure non-negative
    };
  });

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
  };

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Hiring Funnel Analysis</CardTitle>
        <CardDescription>Linear Step-Based Job Assessment Pipeline</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={processedData} margin={{ top: 30 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="stage"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={renderLegend} />
            
            {/* Unaccounted portion to make total equal to stageTotal - should be at the bottom of the stack */}
            <Bar dataKey="unaccounted" stackId="a" fill="hsl(220 10% 90%)" radius={[4, 4, 0, 0]} />
            
            {/* Applications - standalone */}
            <Bar dataKey="total" stackId="a" fill="var(--color-total)" radius={[0, 0, 0, 0]} />
            
            {/* Assessment & Demo Round - stacked breakdown */}
            <Bar dataKey="passed" stackId="a" fill="var(--color-passed)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="failed" stackId="a" fill="var(--color-failed)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="appealed" stackId="a" fill="var(--color-appealed)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="suspended" stackId="a" fill="var(--color-suspended)" radius={[0, 0, 0, 0]} />
            
            {/* Interview - stacked breakdown */}
            <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="scheduled" stackId="a" fill="var(--color-scheduled)" radius={[0, 0, 0, 0]} />
            
            {/* Offered - stacked breakdown */}
            <Bar dataKey="hired" stackId="a" fill="var(--color-hired)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="accepted" stackId="a" fill="var(--color-accepted)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="declined" stackId="a" fill="var(--color-declined)" radius={[0, 0, 0, 0]} />
            
            <LabelList
              dataKey="stageTotal"
              position="top"
              offset={12}
              className="fill-foreground"
              fontSize={12}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}