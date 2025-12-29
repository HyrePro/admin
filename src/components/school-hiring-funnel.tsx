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

interface ConversionRates {
  overall_conversion?: number;
  application_to_assessment?: number;
  assessment_to_demo?: number;
  demo_to_interview?: number;
  interview_to_offer?: number;
  offer_to_hire?: number;
}

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
  conversionRate?: number;
  conversionRates?: ConversionRates;
}

export default function HiringFunnelChart({ funnelData, conversionRate, conversionRates }: HiringFunnelChartProps) {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-1">
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
          </div>
          
          {/* Conversion Rates Display - 2-column grid layout */}
          <div className="lg:col-span-1">
            {conversionRates && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Overall Conversion Rate - First */}
                {conversionRates.overall_conversion !== undefined && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium">Overall Conversion</h3>
                    <p className={`text-2xl font-bold ${conversionRates.overall_conversion > 70 ? 'text-green-600' : conversionRates.overall_conversion > 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {conversionRates.overall_conversion.toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-500">hiring success rate</p>
                  </div>
                )}
                
                {/* Step-by-step Conversion Rates */}
                {conversionRates.application_to_assessment !== undefined && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium">Application to Assessment</h3>
                    <p className={`text-2xl font-bold ${conversionRates.application_to_assessment > 70 ? 'text-green-600' : conversionRates.application_to_assessment > 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {conversionRates.application_to_assessment.toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-500">conversion rate</p>
                  </div>
                )}
                
                {conversionRates.assessment_to_demo !== undefined && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium">Assessment to Demo</h3>
                    <p className={`text-2xl font-bold ${conversionRates.assessment_to_demo > 70 ? 'text-green-600' : conversionRates.assessment_to_demo > 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {conversionRates.assessment_to_demo.toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-500">conversion rate</p>
                  </div>
                )}
                
                {conversionRates.demo_to_interview !== undefined && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium">Demo to Interview</h3>
                    <p className={`text-2xl font-bold ${conversionRates.demo_to_interview > 70 ? 'text-green-600' : conversionRates.demo_to_interview > 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {conversionRates.demo_to_interview.toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-500">conversion rate</p>
                  </div>
                )}
                
                {conversionRates.interview_to_offer !== undefined && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium">Interview to Offer</h3>
                    <p className={`text-2xl font-bold ${conversionRates.interview_to_offer > 70 ? 'text-green-600' : conversionRates.interview_to_offer > 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {conversionRates.interview_to_offer.toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-500">conversion rate</p>
                  </div>
                )}
                
                {conversionRates.offer_to_hire !== undefined && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium">Offer to Hire</h3>
                    <p className={`text-2xl font-bold ${conversionRates.offer_to_hire > 70 ? 'text-green-600' : conversionRates.offer_to_hire > 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {conversionRates.offer_to_hire.toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-500">conversion rate</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}