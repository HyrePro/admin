import * as React from "react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
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

interface AssessmentAnalyticsProps {
  jobId: string;
  chartConfig: ChartConfig;
  mcqAssessmentData: MCQAssessmentAnalytics | null;
  loadingAssessment: boolean;
  setLoadingAssessment: (loading: boolean) => void;
}

// Prepare category metrics data for assessment visualization
export const prepareCategoryMetricsData = (mcqAssessmentData: MCQAssessmentAnalytics | null) => {
  if (!mcqAssessmentData) return [];
  
  return Object.entries(mcqAssessmentData.category_metrics).map(([category, metrics]) => ({
    name: category,
    avg_percentage: metrics.avg_percentage,
    avg_score: metrics.avg_score,
    avg_total_questions: metrics.avg_total_questions,
  }));
};

export function AssessmentAnalytics({ jobId, chartConfig, mcqAssessmentData, loadingAssessment, setLoadingAssessment }: AssessmentAnalyticsProps) {

  const categoryMetricsData = React.useMemo(() => prepareCategoryMetricsData(mcqAssessmentData), [mcqAssessmentData]);

  if (loadingAssessment) {
    return (
      <div className="mt-6">
        <div className="h-16 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!mcqAssessmentData) {
    return (
      <div className="mt-6">
        <p className="text-gray-500">No assessment analytics available.</p>
      </div>
    );
  }

  return (
    <div className="border-b border-l border-r rounded-b-lg rounded-t-none p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assessment Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-600">Passed</h3>
            <p className="text-2xl font-bold text-green-600">
              {mcqAssessmentData.summary.passed}
            </p>
            <p className="text-sm text-gray-500">candidates</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-600">Failed</h3>
            <p className="text-2xl font-bold text-red-600">
              {mcqAssessmentData.summary.failed}
            </p>
            <p className="text-sm text-gray-500">candidates</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-600">Attempted</h3>
            <p className="text-2xl font-bold text-blue-600">
              {mcqAssessmentData.summary.attempted}
            </p>
            <p className="text-sm text-gray-500">candidates</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-600">Eligible</h3>
            <p className="text-2xl font-bold text-purple-600">
              {mcqAssessmentData.summary.eligible}
            </p>
            <p className="text-sm text-gray-500">candidates</p>
          </div>
        </div>
        
        {/* Assessment Performance Chart */}
        <div>
          <h4 className="text-md font-medium mb-3">Assessment Performance by Category</h4>
          <ChartContainer config={chartConfig} className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryMetricsData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value, name) => {
                    if (name === 'avg_percentage') {
                      return [`${value}%`, 'Average Percentage', `Score: ${value}%`];
                    }
                    return [value, name, `${name}: ${value}`];
                  }}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="avg_percentage" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="avg_percentage" position="top" formatter={(value: number) => `${value}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
      
      {/* Additional Assessment Metrics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium">Average Score</h3>
          <p className="text-2xl font-bold text-blue-600">
            {mcqAssessmentData.metrics.avg_score.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">out of {mcqAssessmentData.metrics.avg_total_questions}</p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-medium">Average Percentage</h3>
          <p className="text-2xl font-bold text-purple-600">
            {mcqAssessmentData.metrics.avg_percentage.toFixed(2)}%
          </p>
          <p className="text-sm text-gray-500">overall performance</p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-medium">Questions Attempted</h3>
          <p className="text-2xl font-bold text-amber-600">
            {mcqAssessmentData.metrics.avg_attempted.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">on average</p>
        </div>
      </div>
      
      {/* Category Breakdown */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-3">Category Breakdown</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(mcqAssessmentData.category_metrics).map(([category, metrics], index) => (
            <div key={index} className="border rounded-lg p-4">
              <h3 className="font-medium">{category}</h3>
              <p className="text-lg font-bold mt-2">
                {metrics.avg_percentage.toFixed(2)}%
              </p>
              <p className="text-sm text-gray-500">average</p>
              <div className="mt-2 text-xs text-gray-600">
                <p>Score: {metrics.avg_score.toFixed(2)}/{metrics.avg_total_questions}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}