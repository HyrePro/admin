"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, TooltipProps } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface CategoryMetric {
  avg_percentage: number;
  avg_score: number;
  avg_total_questions: number;
}

interface MCQAssessmentAnalytics {
  summary: {
    passed: number;
    failed: number;
    attempted: number;
    eligible: number;
  };
  metrics: {
    avg_score: number;
    avg_percentage: number;
    avg_attempted: number;
    avg_total_questions: number;
  };
  category_metrics: Record<string, CategoryMetric>;
}

interface RadarDataPoint {
  category: string;
  displayCategory: string;
  percentage: number;
  score: number;
  totalQuestions: number;
}

interface AssessmentRadarChartProps {
  mcqAssessmentData: MCQAssessmentAnalytics | null;
  loadingAssessment: boolean;
}

// Truncate long category names for display
const truncateLabel = (label: string, maxLength: number = 15) => {
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength) + '...';
};

// Prepare data for radar chart
const prepareRadarData = (mcqAssessmentData: MCQAssessmentAnalytics | null) => {
  if (!mcqAssessmentData) return [];
  
  return Object.entries(mcqAssessmentData.category_metrics).map(([category, metrics]) => ({
    category: category,
    displayCategory: truncateLabel(category),
    percentage: metrics.avg_percentage,
    score: metrics.avg_score,
    totalQuestions: metrics.avg_total_questions,
  }));
};

const chartConfig = {
  percentage: {
    label: "Performance %",
    color: "#8b5cf6",
  },
} satisfies ChartConfig;

// Custom tooltip component for radar chart
const CustomRadarTooltip: React.FC<{ radarData?: RadarDataPoint[] } & TooltipProps<number, string>> = ({ active, payload, label, radarData }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload as RadarDataPoint;
    const fullCategory = radarData?.find(d => d.displayCategory === label)?.category || label;
    
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md">
        <div className="font-semibold text-gray-800 mb-1">{fullCategory}</div>
        <div className="text-sm text-gray-600 border-t pt-2 mt-1">
          <div>Performance: <span className="font-medium">{payload[0]?.value}%</span></div>
          <div>Questions: <span className="font-medium">{data?.totalQuestions}</span></div>
          <div>Avg Score: <span className="font-medium">{data?.score?.toFixed(1)}</span></div>
        </div>
      </div>
    );
  }

  return null;
};

export function AssessmentRadarChart({ mcqAssessmentData, loadingAssessment }: AssessmentRadarChartProps) {
  const radarData = React.useMemo(() => prepareRadarData(mcqAssessmentData), [mcqAssessmentData]);

  if (loadingAssessment) {
    return (
      <Card className="h-full">
        <CardHeader className="items-center pb-4">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] lg:h-[500px] bg-gray-200 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (!mcqAssessmentData || radarData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="items-center pb-4">
          <CardTitle>Category Performance</CardTitle>
          <CardDescription>No assessment data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto w-full h-[400px] lg:h-[500px]"
        >
          <RadarChart 
            data={radarData}
            margin={{ top: 20, right: 60, bottom: 20, left: 60 }}
          >
            <ChartTooltip 
              cursor={false} 
              content={<CustomRadarTooltip radarData={radarData} />}
            />
            <PolarAngleAxis 
              dataKey="displayCategory"
              tick={{ fill: '#666', fontSize: 12 }}
              tickLine={false}
            />
            <PolarGrid 
              strokeDasharray="3 3"
              stroke="#e5e7eb"
            />
            <Radar
              dataKey="percentage"
              fill="var(--color-percentage)"
              fillOpacity={0.6}
              stroke="var(--color-percentage)"
              strokeWidth={2}
              dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#8b5cf6" }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      
    </div>
  );
}