"use client"

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
  type ChartConfig,
} from "@/components/ui/chart"
import { JobFunnelAnalyticsWithDemographics } from "./funnel-area-chart";
import React from "react";
const ageChartConfig = {
  count: { label: "Candidates", color: "#3b82f6" },
} satisfies ChartConfig;

function AgeDistributionChart({ demographics }: { demographics?: JobFunnelAnalyticsWithDemographics['demographics'] }) {
  // Check if demographics or age_distribution is null/undefined
  const hasData = demographics?.age_distribution && Object.keys(demographics.age_distribution).some(key => demographics.age_distribution && demographics.age_distribution[key] > 0);
  
  const ageChartData = React.useMemo(() => {
    if (!demographics?.age_distribution) {
      return [
        { bucket: "<18", count: 0 },
        { bucket: "18-24", count: 0 },
        { bucket: "25-34", count: 0 },
        { bucket: "35-44", count: 0 },
        { bucket: "45-54", count: 0 },
        { bucket: "55+", count: 0 },
      ];
    }
    return [
      { bucket: "<18", count: demographics.age_distribution["<18"] || 0 },
      { bucket: "18-24", count: demographics.age_distribution["18-24"] || 0 },
      { bucket: "25-34", count: demographics.age_distribution["25-34"] || 0 },
      { bucket: "35-44", count: demographics.age_distribution["35-44"] || 0 },
      { bucket: "45-54", count: demographics.age_distribution["45-54"] || 0 },
      { bucket: "55+", count: demographics.age_distribution["55+"] || 0 },
    ];
  }, [demographics]);

  return (
    <div className="h-full pb-8 pt-4">
      <CardHeader>
        <CardTitle>Age Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={ageChartConfig} className="h-[250px] w-full">
            <BarChart accessibilityLayer data={ageChartData} margin={{ top: 20 }}>
              <CartesianGrid vertical={false} horizontal={true} strokeDasharray="3 3" strokeOpacity={0.5} />
              <XAxis dataKey="bucket" tickLine={false} tickMargin={10} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={8}>
                <LabelList position="top" offset={10} className="fill-foreground text-xs" />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[250px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">No data available</p>
          </div>
        )}
      </CardContent>
    </div>
  );
}

export default AgeDistributionChart;
