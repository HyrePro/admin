"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
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

const cityChartConfig = {
  count: { label: "Candidates", color: "#3b82f6" },
} satisfies ChartConfig;

function InsideBarLabel(props: { x?: number; y?: number; width?: number; height?: number; value?: number | string; [key: string]: unknown }) {
  const { x, y, width, height, value } = props;
  
  // Check if required properties are present and are numbers
  if (typeof width !== 'number' || width < 30 || 
      typeof x !== 'number' || typeof y !== 'number' || typeof height !== 'number') {
    return null;
  }
  
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-white text-xs font-medium"
    >
      {value}
    </text>
  );
}

function CityDistributionChart({ demographics }: { demographics?: JobFunnelAnalyticsWithDemographics['demographics'] }) {
  const chartData = React.useMemo(() => {
    if (!demographics?.city_distribution) return [];
    return Object.entries(demographics.city_distribution)
      .map(([city, count]) => ({ city, count: Number(count) }))
      .sort((a, b) => b.count - a.count);
  }, [demographics]);

  return (
    <div className="h-full pb-8 pt-4">
      <CardHeader>
        <CardTitle>City Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={cityChartConfig} className="h-[250px] w-full">
          <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
            <CartesianGrid horizontal={false} />
            <YAxis 
              dataKey="city" 
              type="category" 
              tickLine={false}
              axisLine={false}
              width={75}
              tick={{ fontSize: 12 }}
            />
            <XAxis dataKey="count" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={6}>
              <LabelList content={<InsideBarLabel />} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </div>
  );
}
export default CityDistributionChart;
