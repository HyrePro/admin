"use client";

import * as React from "react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useAuthStore } from "@/store/auth-store";
import { getApplicationDistribution, type ApplicationDistribution } from "@/lib/supabase/api/get-application-distribution";

interface ApplicationDistributionData {
  applied: number;
  assessment: number;
  demo: number;
  interview: number;
  offered: number;
  hired: number;
}

const COLORS = [
  "#3b82f6", // Blue - Applied
  "#ef4444", // Red - Assessment
  "#f59e0b", // Amber - Demo
  "#8b5cf6", // Violet - Interview
  "#10b981", // Green - Offered
  "#ec4899", // Pink - Hired
];

const chartConfig = {
  applications: {
    label: "Applications",
  },
  applied: {
    label: "Applied",
    color: "#3b82f6", // Blue
  },
  assessment: {
    label: "Assessment",
    color: "#ef4444", // Red
  },
  demo: {
    label: "Demo",
    color: "#f59e0b", // Amber
  },
  interview: {
    label: "Interview",
    color: "#8b5cf6", // Violet
  },
  offered: {
    label: "Offered",
    color: "#10b981", // Green
  },
  hired: {
    label: "Hired",
    color: "#ec4899", // Pink
  },
} satisfies ChartConfig;

export function ApplicationDistribution() {
  const { user } = useAuth();
  const { schoolId } = useAuthStore();
  const [data, setData] = React.useState<ApplicationDistribution | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchApplicationDistribution = async () => {
      if (!user || !schoolId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getApplicationDistribution(schoolId);
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        if (result.data) {
          setData(result.data);
        } else {
          setData({
            applied: 0,
            assessment: 0,
            demo: 0,
            interview: 0,
            offered: 0,
            hired: 0
          });
        }
      } catch (err) {
        console.error("Error fetching application distribution:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationDistribution();
  }, [user, schoolId]);

  const barChartData = data ? [
    { stage: "Applied", count: data.applied },
    { stage: "Assessment", count: data.assessment },
    { stage: "Demo", count: data.demo },
    { stage: "Interview", count: data.interview },
    { stage: "Offered", count: data.offered },
    { stage: "Hired", count: data.hired },
  ] : [];

  const pieChartData = data ? [
    { name: "Applied", value: data.applied },
    { name: "Assessment", value: data.assessment },
    { name: "Demo", value: data.demo },
    { name: "Interview", value: data.interview },
    { name: "Offered", value: data.offered },
    { name: "Hired", value: data.hired },
  ].filter(item => item.value > 0) : [];

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Application Distribution</CardTitle>
            <CardDescription>Loading application distribution data</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Application Funnel</CardTitle>
            <CardDescription>Loading application funnel data</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Application Distribution</CardTitle>
            <CardDescription>Error loading data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px] text-red-500">
              {error}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Application Funnel</CardTitle>
            <CardDescription>Error loading data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px] text-red-500">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Bar Chart - Application Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Application Distribution</CardTitle>
          <CardDescription>
            Distribution of applications across different stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="stage" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

    </div>
  );
}