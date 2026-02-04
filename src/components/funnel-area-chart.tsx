"use client"

import * as React from "react";
import { Bar, BarChart, XAxis, Pie, PieChart, Label, CartesianGrid, YAxis, LabelList } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Extended interface to include demographics
export interface JobFunnelAnalyticsWithDemographics {
  demographics?: {
    gender?: {
      male: number;
      female: number;
      other: number;
    };
    age_distribution?: Record<string, number>;
    city_distribution?: Record<string, number>;
  };
  stages: {
    applications_submitted?: number;
    assessment_started?: number;
    assessment_passed?: number;
    assessment_failed?: number;
    demo_submitted?: number;
    demo_passed?: number;
    demo_failed?: number;
    interview_scheduled?: number;
    interview_completed?: number;
    offers_extended?: number;
    hired?: number;
    appealed?: number;
    rejected?: number;
    suspended?: number;
  };
}

// Funnel Stage Stacked Bar Chart
const funnelChartConfig = {
  passed: { label: "Passed", color: "#10b981" },
  failed: { label: "Failed", color: "#ef4444" },
  completed: { label: "Completed", color: "#f59e0b" },
  offered: { label: "Offered", color: "#a855f7" },
  rejected: { label: "Rejected", color: "#7f1d1d" },
  hired: { label: "Hired", color: "#7c3aed" },
} satisfies ChartConfig;

function FunnelStageStackedBar({ stages }: { stages: JobFunnelAnalyticsWithDemographics['stages'] }) {
  // Check if there's actual data
  const hasData = stages && (
    (stages.assessment_passed || 0) > 0 ||
    (stages.assessment_failed || 0) > 0 ||
    (stages.demo_passed || 0) > 0 ||
    (stages.demo_failed || 0) > 0 ||
    (stages.interview_completed || 0) > 0 ||
    (stages.offers_extended || 0) > 0 ||
    (stages.rejected || 0) > 0 ||
    (stages.hired || 0) > 0
  );

  const funnelStageData = React.useMemo(() => [
    {
      stage: "Assessment",
      passed: stages.assessment_passed || 0,
      failed: stages.assessment_failed || 0,
    },
    {
      stage: "Demo",
      passed: stages.demo_passed || 0,
      failed: stages.demo_failed || 0,
    },
    {
      stage: "Interview",
      completed: stages.interview_completed || 0,
      offered: stages.offers_extended || 0,
      rejected: stages.rejected || 0,
    },
    {
      stage: "Hired",
      hired: stages.hired || 0,
    },
  ], [stages]);

  return (
    <div className="h-full pt-8 pb-4">
      <CardHeader>
        <CardTitle>Hiring Funnel — Stage Breakdown</CardTitle>
        <CardDescription>Outcome distribution per funnel stage</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={funnelChartConfig} className="h-[250px] w-full mt-4">
            <BarChart data={funnelStageData}>
              <CartesianGrid vertical={false} horizontal={true} strokeDasharray="3 3" strokeOpacity={0.5} />
              <XAxis
                dataKey="stage"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <Bar dataKey="passed" stackId="a" fill="var(--color-passed)" />
              <Bar dataKey="failed" stackId="a" fill="var(--color-failed)" />
              <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" />
              <Bar dataKey="offered" stackId="a" fill="var(--color-offered)" />
              <Bar dataKey="rejected" stackId="a" fill="var(--color-rejected)" />
              <Bar
                dataKey="hired"
                stackId="a"
                fill="var(--color-hired)"
                radius={[4, 4, 0, 0]}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name, item, index) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{ background: `var(--color-${name})` } as React.CSSProperties}
                        />
                        {funnelChartConfig[name as keyof typeof funnelChartConfig]?.label}
                        <div className="ml-auto font-mono tabular-nums">{value}</div>
                        {index === Object.keys(item.payload).length - 2 && (
                          <div className="mt-1.5 flex basis-full border-t pt-1.5 text-xs font-medium">
                            Total
                            <div className="ml-auto font-mono tabular-nums">
                              {Object.entries(item.payload)
                                .filter(([k]) => k !== "stage")
                                .reduce((s, [, v]) => s + (v as number), 0)}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[250px] w-full flex items-center justify-center mt-4">
            <p className="text-muted-foreground">No data available</p>
          </div>
        )}
      </CardContent>
    </div>
  );
}

export default FunnelStageStackedBar;
