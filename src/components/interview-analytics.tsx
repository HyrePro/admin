import * as React from "react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
  TooltipProps,
  Pie,
  PieChart,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { getInterviewAnalytics, type InterviewAnalytics as InterviewAnalyticsType } from "@/lib/supabase/api/get-interview-analytics";
import { IconFolderCode } from "@tabler/icons-react";
import { ArrowUpRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface InterviewAnalyticsProps {
  jobId: string;
  chartConfig: ChartConfig;
  interviewAnalyticsData: InterviewAnalyticsType | null;
  loadingInterview: boolean;
  setLoadingInterview: (loading: boolean) => void;
}

// Prepare category metrics data for interview visualization
export const prepareCategoryMetricsData = (interviewAnalyticsData: InterviewAnalyticsType | null) => {
  if (!interviewAnalyticsData) return [];

  return interviewAnalyticsData.panelist_overview.map((metric) => ({
    name: metric.title,
    average: metric.average,
    out_of: metric.out_of,
    evaluation_count: metric.evaluation_count,
  }));
};

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="border-border/50 bg-background min-w-[150px] rounded-lg border px-3 py-2 text-xs shadow-xl">
        <p className="font-medium mb-2">Interview Metrics</p>
        {payload.map((entry, index) => {
          const labels: Record<string, string> = {
            scheduled: 'Scheduled',
            completed: 'Completed',
            eligible: 'Eligible',
            rejected: 'Rejected',
            offered: 'Offered',
            hired: 'Hired',
          };
          
          const colors: Record<string, string> = {
            scheduled: '#f59e0b',
            completed: '#8b5cf6',
            eligible: '#3b82f6',
            rejected: '#ef4444',
            offered: '#10b981',
            hired: '#ec4899',
          };
          
          return (
            <div key={`item-${index}`} className="flex items-center gap-2 mb-1 last:mb-0">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: colors[entry.dataKey as string] }}
              />
              <span className="text-muted-foreground">{labels[entry.dataKey as string]}</span>
              <span className="font-medium ml-auto">{Number(entry.value).toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

export function InterviewAnalytics({ jobId, chartConfig, interviewAnalyticsData, loadingInterview, setLoadingInterview }: InterviewAnalyticsProps) {

  const categoryMetricsData = React.useMemo(() => prepareCategoryMetricsData(interviewAnalyticsData), [interviewAnalyticsData]);

  if (loadingInterview) {
    return (
      <div className="mt-6">
        <div className="h-16 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!interviewAnalyticsData) {
    return (
      <div className="mt-6">
        <p className="text-gray-500">No interview analytics available.</p>
      </div>
    );
  }

  // Get sorted categories by performance
  const sortedCategories = [...interviewAnalyticsData.panelist_overview]
    .sort((a, b) => b.average - a.average);

  const bestCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;
  const worstCategory = sortedCategories.length > 0 ? sortedCategories[sortedCategories.length - 1] : null;
  
  // Check if all category scores are zero
  const allCategoriesZero = interviewAnalyticsData.panelist_overview.length > 0 && 
    interviewAnalyticsData.panelist_overview.every(metric => metric.average === 0);
  
  // Check if all panelist summary metrics are zero
  const allPanelistMetricsZero = (
    interviewAnalyticsData.panelist_summary.total_panelists === 0 &&
    interviewAnalyticsData.panelist_summary.total_evaluations === 0 &&
    interviewAnalyticsData.panelist_summary.avg_panelist_score === 0 &&
    interviewAnalyticsData.panelist_summary.max_panelist_score === 0 &&
    interviewAnalyticsData.panelist_summary.total_score_available === 0
  );
  
  // Prepare data for the funnel chart
  const funnelData = [
    { name: 'Eligible', value: interviewAnalyticsData.interview_funnel.eligible, fill: '#3b82f6' },
    { name: 'Scheduled', value: interviewAnalyticsData.interview_funnel.scheduled, fill: '#f59e0b' },
    { name: 'Completed', value: interviewAnalyticsData.interview_funnel.completed, fill: '#8b5cf6' },
    { name: 'Rejected', value: interviewAnalyticsData.interview_funnel.rejected, fill: '#ef4444' },
    { name: 'Offered', value: interviewAnalyticsData.interview_funnel.offered, fill: '#10b981' },
    { name: 'Hired', value: interviewAnalyticsData.interview_funnel.hired, fill: '#ec4899' },
  ];

  return (
    <div className="border-b border-l border-r rounded-b-lg rounded-t-none p-4">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Averages Summary Cards */}
          <div className="lg:w-1/3">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium">Average Score</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  {interviewAnalyticsData.score_statistics.avg_score.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">out of max score</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-medium">Max Score</h3>
                <p className="text-2xl font-bold text-amber-600">
                  {interviewAnalyticsData.score_statistics.max_score.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">highest achieved</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-medium">Total Evaluations</h3>
                <p className="text-2xl font-bold text-amber-600">
                  {interviewAnalyticsData.score_statistics.total_evaluations}
                </p>
                <p className="text-sm text-gray-500">interviews</p>
              </div>
            </div>
          </div>

          {/* Interview Funnel Chart */}
          <div className="lg:w-2/3">
            <ChartContainer config={{
              eligible: {
                label: 'Eligible',
                color: '#3b82f6',
              },
              scheduled: {
                label: 'Scheduled',
                color: '#f59e0b',
              },
              completed: {
                label: 'Completed',
                color: '#8b5cf6',
              },
              rejected: {
                label: 'Rejected',
                color: '#ef4444',
              },
              offered: {
                label: 'Offered',
                color: '#10b981',
              },
              hired: {
                label: 'Hired',
                color: '#ec4899',
              },
            }} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[{
                    name: 'Metrics',
                    eligible: interviewAnalyticsData.interview_funnel.eligible,
                    scheduled: interviewAnalyticsData.interview_funnel.scheduled,
                    completed: interviewAnalyticsData.interview_funnel.completed,
                    rejected: interviewAnalyticsData.interview_funnel.rejected,
                    offered: interviewAnalyticsData.interview_funnel.offered,
                    hired: interviewAnalyticsData.interview_funnel.hired,
                  }]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    content={<CustomTooltip />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar 
                    dataKey="eligible" 
                    name="Eligible" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="scheduled" 
                    name="Scheduled" 
                    fill="#f59e0b" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="completed" 
                    name="Completed" 
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="rejected" 
                    name="Rejected" 
                    fill="#ef4444" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="offered" 
                    name="Offered" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="hired" 
                    name="Hired" 
                    fill="#ec4899" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </div>

      {/* Category Performance - Radar Chart with Details */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-3">Interview Panelist Performance Analysis</h4>
        {allPanelistMetricsZero ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconFolderCode />
              </EmptyMedia>
              <EmptyTitle>No Panelist Review Data</EmptyTitle>
              <EmptyDescription>
                No panelist evaluations have been conducted yet. Get started by conducting
                your first panelist review.
              </EmptyDescription>
            </EmptyHeader>
            
          </Empty>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <RadarChart data={categoryMetricsData}>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <PolarAngleAxis dataKey="name" />
                  <PolarGrid />
                  <Radar
                    dataKey="average"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ChartContainer>
            </div>

            {/* Category Details Cards - Responsive 2x2 grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Check if all category scores are zero */}
              {allCategoriesZero ? (
                <div className="col-span-full">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <IconFolderCode />
                      </EmptyMedia>
                      <EmptyTitle>No Category Data Available</EmptyTitle>
                      <EmptyDescription>
                        All category scores are zero. Evaluate panelists to generate meaningful data.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <div className="flex gap-2">
                        <Button variant="outline">Learn More</Button>
                      </div>
                    </EmptyContent>
                  </Empty>
                </div>
              ) : (
                <>
                  {/* Category Count */}
                  <div className="border rounded-lg p-4 min-h-[120px]">
                    <h3 className="font-medium text-gray-600">Categories</h3>
                    <p className="text-2xl font-bold text-sky-600">
                      {interviewAnalyticsData.panelist_overview.length}
                    </p>
                    <p className="text-sm text-gray-500">Total assessment areas</p>
                  </div>

                  {/* Performance Range */}
                  <div className="border rounded-lg p-4 min-h-[120px]">
                    <h3 className="font-medium text-gray-600">Performance Range</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {worstCategory ? worstCategory.average.toFixed(1) : '0'} - {bestCategory ? bestCategory.average.toFixed(1) : '0'}
                    </p>
                    <p className="text-sm text-gray-500">Score range</p>
                  </div>
                  
                  {/* Panelist Summary */}
                  <div className="border rounded-lg p-4 min-h-[120px]">
                    <h3 className="font-medium text-gray-600">Total Panelists</h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {interviewAnalyticsData.panelist_summary.total_panelists}
                    </p>
                    <p className="text-sm text-gray-500">panelists</p>
                  </div>
                  
                  <div className="border rounded-lg p-4 min-h-[120px]">
                    <h3 className="font-medium text-gray-600">Avg Panelist Score</h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {interviewAnalyticsData.panelist_summary.avg_panelist_score.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-500">score</p>
                  </div>
                  
                  {/* Map through all categories */}
                  {interviewAnalyticsData.panelist_overview.map((metric) => (
                    <div key={metric.title} className="border rounded-lg p-4 min-h-[120px]">
                      <h3 className="font-medium text-gray-600 text-sm">{metric.title}</h3>
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        {metric.average.toFixed(1)}
                      </p>
                      <p className="text-sm text-gray-500 truncate mt-1">Average Score</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      
    </div>
  );
}