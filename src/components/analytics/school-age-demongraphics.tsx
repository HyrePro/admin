import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import React from "react"

const ageChartConfig = {
  count: { label: "Candidates", color: "#3b82f6" },
}

// Define the type for age distribution
interface AgeDistribution {
  "<18": number;
  "18-24": number;
  "25-34": number;
  "35-44": number;
  "45-54": number;
  "55+": number;
}

interface DemographicsData {
  age_distribution: AgeDistribution;
}

// Sample data for demonstration
const sampleDemographics: DemographicsData = {
  age_distribution: {
    "<18": 5,
    "18-24": 45,
    "25-34": 120,
    "35-44": 85,
    "45-54": 42,
    "55+": 18
  }
}

interface AgeDistributionChartProps {
  demographics?: {
    age_distribution?: {
      bucket: string;
      count: number;
    }[];
  };
}

function AgeDistributionChart({ demographics }: AgeDistributionChartProps) {
  const demographicsData = demographics || sampleDemographics

  const hasData = demographicsData?.age_distribution && 
    Object.values(demographicsData.age_distribution || {}).some(
      value => value > 0
    )

  const ageChartData = React.useMemo(() => {
    if (!demographicsData?.age_distribution) {
      return [
        { bucket: "<18", count: 0 },
        { bucket: "18-24", count: 0 },
        { bucket: "25-34", count: 0 },
        { bucket: "35-44", count: 0 },
        { bucket: "45-54", count: 0 },
        { bucket: "55+", count: 0 },
      ]
    }
    const ageDist = demographicsData?.age_distribution;
    if (Array.isArray(ageDist)) {
      return ageDist;
    } else {
      return [
        { bucket: "<18", count: ageDist?.["<18"] || 0 },
        { bucket: "18-24", count: ageDist?.["18-24"] || 0 },
        { bucket: "25-34", count: ageDist?.["25-34"] || 0 },
        { bucket: "35-44", count: ageDist?.["35-44"] || 0 },
        { bucket: "45-54", count: ageDist?.["45-54"] || 0 },
        { bucket: "55+", count: ageDist?.["55+"] || 0 },
      ];
    }
  }, [demographics])

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-none">
      <CardHeader>
        <CardTitle>Age Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={ageChartConfig} className="h-[300px] w-full">
            <BarChart 
              accessibilityLayer 
              data={ageChartData} 
              margin={{ top: 20 }}
            >
              <CartesianGrid 
                vertical={false} 
                horizontal={true} 
                strokeDasharray="3 3" 
                strokeOpacity={0.5} 
              />
              <XAxis 
                dataKey="bucket" 
                tickLine={false} 
                tickMargin={10} 
                axisLine={false} 
              />
              <ChartTooltip 
                cursor={false} 
                content={<ChartTooltipContent hideLabel />} 
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={8}>
                <LabelList 
                  position="top" 
                  offset={10} 
                  className="fill-foreground text-xs" 
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AgeDistributionChart