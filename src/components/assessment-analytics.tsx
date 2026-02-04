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
} from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { getMcqAssessmentAnalytics, type MCQAssessmentAnalytics } from "@/lib/supabase/api/get-mcq-assessment-analytics";
import { AssessmentRadarChart } from "./assessment-radar-data";

interface AssessmentAnalyticsProps {
  jobId: string;
  chartConfig: ChartConfig;
  mcqAssessmentData: MCQAssessmentAnalytics | null;
  loadingAssessment: boolean;
  setLoadingAssessment: (loading: boolean) => void;
  errorAssessment?: string | null;
}

// Prepare category metrics data for assessment visualization
export const prepareCategoryMetricsData = (mcqAssessmentData: MCQAssessmentAnalytics | null) => {
  if (!mcqAssessmentData) return [];

  return Object.entries(mcqAssessmentData.category_metrics).map(([category, metrics]) => ({
    name: category,
    avg_percentage: metrics.avg_percentage,
    avg_score: metrics.avg_score,
    avg_total_questions: metrics.avg_total_questions,
    remaining_questions: metrics.avg_total_questions - metrics.avg_score,
  }));
};

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="border-border/50 bg-background min-w-[150px] rounded-lg border px-3 py-2 text-xs shadow-xl">
        <p className="font-medium mb-2">Metrics</p>
        {payload.map((entry, index) => {
          const labels: Record<string, string> = {
            eligible: 'Eligible',
            attempted: 'Attempted',
            passed: 'Passed',
            failed: 'Failed',
          };
          
          const colors: Record<string, string> = {
            eligible: '#8b5cf6',
            attempted: '#3b82f6',
            passed: '#10b981',
            failed: '#ef4444',
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

export function AssessmentAnalytics({ jobId, chartConfig, mcqAssessmentData, loadingAssessment, setLoadingAssessment, errorAssessment = null }: AssessmentAnalyticsProps) {

  const categoryMetricsData = React.useMemo(() => prepareCategoryMetricsData(mcqAssessmentData), [mcqAssessmentData]);

  if (loadingAssessment) {
    return (
      <div className="p-6">
        <div className="h-16 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (errorAssessment) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-700">
          Failed to load assessment analytics. {errorAssessment}
        </p>
      </div>
    );
  }

  if (!mcqAssessmentData) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">No assessment analytics available yet.</p>
      </div>
    );
  }

  // Get sorted categories by performance
  const sortedCategories = Object.entries(mcqAssessmentData.category_metrics)
    .sort(([, a], [, b]) => b.avg_percentage - a.avg_percentage);

  const bestCategory = sortedCategories[0];
  const worstCategory = sortedCategories[sortedCategories.length - 1];
  
  // Create a set of category names for quick lookup of best/worst
  const bestCategoryName = bestCategory[0];
  const worstCategoryName = worstCategory[0];

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Averages Summary Cards */}
          <div className="lg:w-1/3">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium">Average Score</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  {mcqAssessmentData!.metrics.avg_score.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">out of {mcqAssessmentData!.metrics.avg_total_questions}</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-medium">Average Percentage</h3>
                <p className="text-2xl font-bold text-amber-600">
                  {mcqAssessmentData!.metrics.avg_percentage.toFixed(2)}%
                </p>
                <p className="text-sm text-gray-500">overall performance</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-medium">Questions Attempted</h3>
                <p className="text-2xl font-bold text-amber-600">
                  {mcqAssessmentData!.metrics.avg_attempted.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">on average</p>
              </div>
            </div>
          </div>

          {/* New Assessment Metrics Chart */}
          <div className="lg:w-2/3">
            <ChartContainer config={{
              eligible: {
                label: 'Eligible',
                color: '#8b5cf6',
              },
              attempted: {
                label: 'Attempted',
                color: '#3b82f6',
              },
              passed: {
                label: 'Passed',
                color: '#10b981',
              },
              failed: {
                label: 'Failed',
                color: '#ef4444',
              },
            }} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[{
                    name: 'Metrics',
                    eligible: mcqAssessmentData!.summary.eligible,
                    attempted: mcqAssessmentData!.summary.attempted,
                    passed: mcqAssessmentData!.summary.passed,
                    failed: mcqAssessmentData!.summary.failed,
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
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="attempted" 
                    name="Attempted" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="passed" 
                    name="Passed" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="failed" 
                    name="Failed" 
                    fill="#ef4444" 
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
        <h4 className="text-md font-medium mb-3">Category Performance Analysis</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div>
            <AssessmentRadarChart
              mcqAssessmentData={mcqAssessmentData}
              loadingAssessment={loadingAssessment}
            />
          </div>

          {/* Category Details Cards - Responsive 2x2 grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Count */}
            <div className="border rounded-lg p-4 min-h-[120px]">
              <h3 className="font-medium text-gray-600">Categories</h3>
              <p className="text-2xl font-bold text-sky-600">
                {Object.keys(mcqAssessmentData!.category_metrics).length}
              </p>
              <p className="text-sm text-gray-500">Total assessment areas</p>
            </div>

            {/* Performance Range */}
            <div className="border rounded-lg p-4 min-h-[120px]">
              <h3 className="font-medium text-gray-600">Performance Range</h3>
              <p className="text-2xl font-bold text-blue-600">
                {worstCategory[1].avg_percentage.toFixed(1)}% - {bestCategory[1].avg_percentage.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Spread: {(bestCategory[1].avg_percentage - worstCategory[1].avg_percentage).toFixed(1)}%</p>
            </div>
            
            {/* Map through all categories */}
            {Object.entries(mcqAssessmentData!.category_metrics).map(([categoryName, metrics]) => (
              <div key={categoryName} className="border rounded-lg p-4 min-h-[120px]">
                <h3 className="font-medium text-gray-600 text-sm">{categoryName}</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {metrics.avg_percentage.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 truncate mt-1">Performance</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
