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
import { getDemoAnalytics, type DemoAnalytics } from "@/lib/supabase/api/get-demo-analytics";

interface DemoAnalyticsProps {
  jobId: string;
  chartConfig: ChartConfig;
  demoAnalyticsData: DemoAnalytics | null;
  loadingDemo: boolean;
  setLoadingDemo: (loading: boolean) => void;
  errorDemo?: string | null;
}

// Prepare category metrics data for demo visualization
export const prepareCategoryMetricsData = (demoAnalyticsData: DemoAnalytics | null) => {
  if (!demoAnalyticsData) return [];

  return Object.entries(demoAnalyticsData.category_scores).map(([category, metrics]) => ({
    name: category,
    avg_score: metrics.avg_score,
    max_score: metrics.max_score,
    min_score: metrics.min_score,
    evaluated_count: metrics.evaluated_count,
  }));
};

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="border-border/50 bg-background min-w-[150px] rounded-lg border px-3 py-2 text-xs shadow-xl">
        <p className="font-medium mb-2">Metrics</p>
        {payload.map((entry, index) => {
          const labels: Record<string, string> = {
            failed: 'Failed',
            passed: 'Passed',
            eligible: 'Eligible',
            submitted: 'Submitted',
          };
          
          const colors: Record<string, string> = {
            failed: '#ef4444',
            passed: '#10b981',
            eligible: '#3b82f6',
            submitted: '#f59e0b',
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

export function DemoAnalytics({ jobId, chartConfig, demoAnalyticsData, loadingDemo, setLoadingDemo, errorDemo = null }: DemoAnalyticsProps) {

  const categoryMetricsData = React.useMemo(() => prepareCategoryMetricsData(demoAnalyticsData), [demoAnalyticsData]);

  if (loadingDemo) {
    return (
      <div className="p-6">
        <div className="h-16 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (errorDemo) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-700">
          Failed to load demo analytics. {errorDemo}
        </p>
      </div>
    );
  }

  if (!demoAnalyticsData) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">No demo analytics available yet.</p>
      </div>
    );
  }

  // Get sorted categories by performance
  const sortedCategories = Object.entries(demoAnalyticsData.category_scores)
    .sort(([, a], [, b]) => b.avg_score - a.avg_score);

  const bestCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;
  const worstCategory = sortedCategories.length > 0 ? sortedCategories[sortedCategories.length - 1] : null;
  
  // Create a set of category names for quick lookup of best/worst
  const bestCategoryName = bestCategory ? bestCategory[0] : null;
  const worstCategoryName = worstCategory ? worstCategory[0] : null;

  // Prepare data for the pie chart
  const funnelData = [
    { name: 'Passed', value: demoAnalyticsData.demo_funnel.passed, fill: '#10b981' },
    { name: 'Failed', value: demoAnalyticsData.demo_funnel.failed, fill: '#ef4444' },
    { name: 'Eligible', value: demoAnalyticsData.demo_funnel.started, fill: '#3b82f6' },
    { name: 'Submitted', value: demoAnalyticsData.demo_funnel.submitted, fill: '#f59e0b' },
  ];

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
                  {demoAnalyticsData!.overall_scores.avg_score.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">out of max score</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-medium">Max Score</h3>
                <p className="text-2xl font-bold text-amber-600">
                  {demoAnalyticsData!.overall_scores.max_score.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">highest achieved</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-medium">Evaluated Count</h3>
                <p className="text-2xl font-bold text-amber-600">
                  {demoAnalyticsData!.overall_scores.evaluated_count}
                </p>
                <p className="text-sm text-gray-500">candidates</p>
              </div>
            </div>
          </div>

          {/* Demo Funnel Chart */}
          <div className="lg:w-2/3">
            <ChartContainer config={{
              eligible: {
                label: 'Eligible',
                color: '#3b82f6',
              },
              submitted: {
                label: 'Submitted',
                color: '#f59e0b',
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
                    eligible: demoAnalyticsData!.demo_funnel.started,
                    submitted: demoAnalyticsData!.demo_funnel.submitted,
                    passed: demoAnalyticsData!.demo_funnel.passed,
                    failed: demoAnalyticsData!.demo_funnel.failed,
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
                    dataKey="submitted" 
                    name="Submitted" 
                    fill="#f59e0b" 
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

      {/* Category Performance - Pie Chart with Details */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-3">Category Performance Analysis</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <RadarChart data={categoryMetricsData}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <PolarAngleAxis dataKey="name" />
                <PolarGrid />
                <Radar
                  dataKey="avg_score"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ChartContainer>
          </div>

          {/* Category Details Cards - Responsive 2x2 grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Count */}
            <div className="border rounded-lg p-4 min-h-[120px]">
              <h3 className="font-medium text-gray-600">Categories</h3>
              <p className="text-2xl font-bold text-sky-600">
                {Object.keys(demoAnalyticsData!.category_scores).length}
              </p>
              <p className="text-sm text-gray-500">Total assessment areas</p>
            </div>

            {/* Performance Range */}
            <div className="border rounded-lg p-4 min-h-[120px]">
              <h3 className="font-medium text-gray-600">Performance Range</h3>
              <p className="text-2xl font-bold text-blue-600">
                {worstCategory ? worstCategory[1].avg_score.toFixed(1) : '0'} - {bestCategory ? bestCategory[1].avg_score.toFixed(1) : '0'}
              </p>
              <p className="text-sm text-gray-500">Score range</p>
            </div>
            
            {/* Map through all categories */}
            {Object.entries(demoAnalyticsData!.category_scores).map(([categoryName, metrics]) => (
              <div key={categoryName} className="border rounded-lg p-4 min-h-[120px]">
                <h3 className="font-medium text-gray-600 text-sm">{categoryName}</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {metrics.avg_score.toFixed(1)}
                </p>
                <p className="text-sm text-gray-500 truncate mt-1">Average Score</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
