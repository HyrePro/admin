"use client"

import * as React from "react"
import { Pie, PieChart, Label } from "recharts"

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
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { JobFunnelAnalyticsWithDemographics } from "./funnel-area-chart"

const genderChartConfig = {
  count: { label: "Candidates" },
  male: { label: "Male", color: "#3b82f6" },
  female: { label: "Female", color: "#ec4899" },
  other: { label: "Other / Prefer not to say", color: "#8b5cf6" },
} satisfies ChartConfig;

function GenderDonutChart({ demographics }: { demographics?: JobFunnelAnalyticsWithDemographics['demographics'] }) {
  const genderChartData = React.useMemo(() => {
    if (!demographics?.gender) return [];
    return [
      { gender: "male", count: demographics.gender.male || 0, fill: "var(--color-male)" },
      { gender: "female", count: demographics.gender.female || 0, fill: "var(--color-female)" },
      { gender: "other", count: demographics.gender.other || 0, fill: "var(--color-other)" },
    ].filter(d => d.count > 0);
  }, [demographics]);

  const totalApplicants = React.useMemo(
    () => genderChartData.reduce((s, d) => s + d.count, 0),
    [genderChartData]
  );
  const hasData = totalApplicants > 0;

  return (
    <div className="h-full pt-8 pb-4">
      <CardHeader className="items-center pb-0">
        <CardTitle>Gender Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center pb-6">
        {hasData ? (
          <ChartContainer config={genderChartConfig} className="mx-auto h-[250px] w-full justify-center items-center">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={genderChartData}
                dataKey="count"
                nameKey="gender"
                innerRadius={60}
                outerRadius={90}
                strokeWidth={4}
              >
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox)) return null;
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan className="fill-foreground text-3xl font-bold" x={viewBox.cx} y={viewBox.cy}>
                          {totalApplicants}
                        </tspan>
                        <tspan className="fill-muted-foreground text-sm" x={viewBox.cx} y={(viewBox.cy ?? 0) + 22}>
                          Applications
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
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

export default GenderDonutChart;
