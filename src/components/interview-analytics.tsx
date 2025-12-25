import * as React from "react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { JobFunnelAnalytics } from "@/lib/supabase/api/get-job-analytics";
import type { JobOverviewAnalytics } from "@/lib/supabase/api/get-job-analytics";

interface InterviewAnalyticsProps {
  funnelData: JobFunnelAnalytics | null;
  overviewData: JobOverviewAnalytics | null;
  chartConfig: ChartConfig;
}

// Prepare interview stage data for individual stage charts
export const prepareInterviewStageData = (funnelData: JobFunnelAnalytics | null) => {
  if (!funnelData) return [];
  const stages = funnelData.stages;
  return [
    { name: 'Scheduled', value: stages.interview_scheduled, type: 'scheduled' },
    { name: 'Completed', value: stages.interview_completed, type: 'completed' },
  ].filter(item => item.value > 0);
};

export function InterviewAnalytics({ funnelData, overviewData, chartConfig }: InterviewAnalyticsProps) {
  const interviewStageData = React.useMemo(() => prepareInterviewStageData(funnelData), [funnelData]);

  // Calculate interview completion rate based on overview data
  const interviewCompletionRate = overviewData && overviewData.total_applicants > 0 
    ? ((overviewData.interviews_completed / overviewData.total_applicants) * 100).toFixed(1) 
    : '0';

  return (
    <div className="border-b border-l border-r rounded-b-lg rounded-t-none p-4">
      <ChartContainer config={chartConfig} className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={interviewStageData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              formatter={(value, name) => {
                if (name === 'scheduled') {
                  return [value, 'Scheduled', `Scheduled: ${value}`];
                } else if (name === 'completed') {
                  return [value, 'Completed', `Completed: ${value}`];
                }
                return [value, name, `${name}: ${value}`];
              }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
              {interviewStageData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.type === 'scheduled' ? '#f59e0b' : '#8b5cf6'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium">Completion Rate</h3>
          <p className="text-2xl font-bold text-purple-600">
            {interviewCompletionRate}%
          </p>
          <p className="text-sm text-gray-500">
            {overviewData?.interviews_completed} completed
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-medium">Scheduled</h3>
          <p className="text-2xl font-bold text-amber-600">
            {overviewData?.interviews_completed}
          </p>
          <p className="text-sm text-gray-500">
            Interviews scheduled
          </p>
        </div>
      </div>
    </div>
  );
}