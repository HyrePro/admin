"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CandidateFunnelStage } from "@/types/candidate-funnel-analytics";
import { stageToPlainLabel } from "@/components/analytics/candidate-funnel/event-labels";

type FunnelBlockProps = {
  stages: CandidateFunnelStage[];
};

const chartConfig = {
  count: {
    label: "Candidates",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const STAGE_COLORS = ["#0ea5e9", "#16a34a", "#ef4444"];

export default function FunnelBlock({ stages }: FunnelBlockProps) {
  const prepared = stages.map((stage, index) => ({
    ...stage,
    label: stageToPlainLabel(stage.label),
    fill: STAGE_COLORS[index] || "#64748b",
  }));

  const submitted = prepared[0]?.count || 0;
  const reachedAssessment = prepared[1]?.count || 0;
  const droppedBeforeAssessment = prepared[2]?.count || 0;

  return (
    <Card className="py-4">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-base">Application to MCQ (Simple View)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pt-3">
        <p className="rounded-md border bg-muted/30 p-3 text-sm">
          Out of <span className="font-semibold">{submitted.toLocaleString()}</span> submitted applications,{" "}
          <span className="font-semibold">{reachedAssessment.toLocaleString()}</span> reached the MCQ assessment
          step and <span className="font-semibold text-red-600">{droppedBeforeAssessment.toLocaleString()}</span>{" "}
          dropped before MCQ.
        </p>

        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <BarChart data={prepared} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => [
                    <span key="val" className="font-semibold">{Number(value).toLocaleString()}</span>,
                    "Candidates",
                  ]}
                />
              }
            />
            <Bar dataKey="count" radius={6}>
              {prepared.map((item) => (
                <Cell key={item.label} fill={item.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
