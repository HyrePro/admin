"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  getJobApplicationScores, 
  type JobApplicationScore 
} from "@/lib/supabase/api/get-job-application-scores";

interface JobAnalyticsProps {
  jobId: string;
}

interface ChartDataItem {
  category: string;
  score: number;
  attempted: number;
  totalQuestions: number;
  accuracy: number;
}

interface OverallStatsItem {
  applicationId: string;
  score: number;
  attempted: number;
  totalQuestions: number;
  accuracy: number;
}

const COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Green
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
  "#6366f1", // Indigo
];

const chartConfig = {
  score: {
    label: "Score",
    color: "#3b82f6", // Blue
  },
  attempted: {
    label: "Attempted",
    color: "#ef4444", // Red
  },
  totalQuestions: {
    label: "Total Questions",
    color: "#10b981", // Green
  },
  accuracy: {
    label: "Accuracy %",
    color: "#f59e0b", // Amber
  },
} satisfies ChartConfig;

export function JobAnalytics({ jobId }: JobAnalyticsProps) {
  const [data, setData] = React.useState<JobApplicationScore[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await getJobApplicationScores(jobId);
      
      if (result.error) {
        setError(result.error);
      } else {
        setData(result.data);
      }
      
      setLoading(false);
    };

    if (jobId) {
      fetchData();
    }
  }, [jobId]);

  // Process data for different chart types - must be before conditional returns
  const categoryAverages = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const categories: Record<string, { totalScore: number; totalAttempted: number; totalQuestions: number; count: number }> = {};
    
    data.forEach((app) => {
      Object.entries(app.category_scores).forEach(([category, scores]) => {
        if (!categories[category]) {
          categories[category] = { totalScore: 0, totalAttempted: 0, totalQuestions: 0, count: 0 };
        }
        categories[category].totalScore += scores.score;
        categories[category].totalAttempted += scores.attempted;
        categories[category].totalQuestions += scores.total_questions;
        categories[category].count += 1;
      });
    });

    return Object.entries(categories).map(([category, stats]) => ({
      category,
      score: Math.round((stats.totalScore / stats.count) * 10) / 10,
      attempted: Math.round((stats.totalAttempted / stats.count) * 10) / 10,
      totalQuestions: Math.round((stats.totalQuestions / stats.count) * 10) / 10,
      accuracy: stats.totalAttempted > 0 
        ? Math.round((stats.totalScore / stats.totalAttempted) * 100 * 10) / 10 
        : 0,
    }));
  }, [data]);

  const overallStats = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((app, index) => ({
      applicationId: `App ${index + 1}`,
      score: app.overall.score,
      attempted: app.overall.attempted,
      totalQuestions: app.overall.total_questions,
      accuracy: app.overall.attempted > 0 
        ? Math.round((app.overall.score / app.overall.attempted) * 100 * 10) / 10 
        : 0,
    }));
  }, [data]);

  const summaryStats = React.useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalApplications: 0,
        avgScore: 0,
        avgAttempted: 0,
        avgAccuracy: 0,
      };
    }
    
    const totalApplications = data.length;
    const avgScore = Math.round((data.reduce((sum, app) => sum + app.overall.score, 0) / totalApplications) * 10) / 10;
    const avgAttempted = Math.round((data.reduce((sum, app) => sum + app.overall.attempted, 0) / totalApplications) * 10) / 10;
    const avgAccuracy = Math.round((data.reduce((sum, app) => sum + (app.overall.attempted > 0 ? (app.overall.score / app.overall.attempted) * 100 : 0), 0) / totalApplications) * 10) / 10;
    
    return {
      totalApplications,
      avgScore,
      avgAttempted,
      avgAccuracy,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 w-[200px] bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Analytics</CardTitle>
          <CardDescription>
            Failed to load job application analytics: {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Analytics Data</CardTitle>
          <CardDescription>
            No application scores available for this job yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          </CardHeader>
          <CardContent className="py-0 my-0">
            <div className="text-2xl font-bold">{summaryStats.totalApplications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent className="py-0 my-0">
            <div className="text-2xl font-bold">{summaryStats.avgScore}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Average Attempted</CardTitle>
          </CardHeader>
          <CardContent className="py-0 my-0">
            <div className="text-2xl font-bold">{summaryStats.avgAttempted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
          </CardHeader>
          <CardContent className="py-0 my-0">
            <div className="text-2xl font-bold">{summaryStats.avgAccuracy}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Performance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>
              Average scores by category across all applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={categoryAverages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="score" fill="#3b82f6" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Accuracy Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Category Accuracy Distribution</CardTitle>
            <CardDescription>
              Accuracy percentage by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={categoryAverages}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, accuracy }) => `${category}: ${accuracy}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="accuracy"
                >
                  {categoryAverages.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Overall Scores Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Individual Application Scores</CardTitle>
            <CardDescription>
              Score progression across applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={overallStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="applicationId" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="attempted" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance Radar</CardTitle>
            <CardDescription>
              Multi-dimensional view of category performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <RadarChart data={categoryAverages}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={30} domain={[0, "dataMax"]} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}