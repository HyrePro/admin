"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import { useAuthStore } from "@/store/auth-store"
import { Users, UserCheck, Briefcase, Award, TrendingUp } from "lucide-react"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useHiringProgress } from "@/hooks/useHiringProgress"

interface HiringProgressChartProps {
  schoolId?: string;
}

export interface HiringProgressData {
  candidates_screened: number;
  shortlisted_for_interview: number;
  interviews_completed: number;
  offers_extended: number;
}

const HiringProgressChart: React.FC<HiringProgressChartProps> = ({ schoolId: propSchoolId }) => {
  const { schoolId: storeSchoolId } = useAuthStore();
  const effectiveSchoolId = propSchoolId || storeSchoolId;
  
  // Only fetch data when we have a valid school ID
  const isValidSchoolId = effectiveSchoolId && effectiveSchoolId !== '';
  
  const {
    data,
    isLoading: loading,
    error: queryError
  } = useHiringProgress(isValidSchoolId ? effectiveSchoolId : '');
  
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'An unknown error occurred') : null;

  const chartData = React.useMemo(() => {
    if (!data) return [];
    
    return [
      { 
        stage: "Candidates Screened", 
        count: data.candidates_screened, 
        fill: "var(--color-screened)" 
      },
      { 
        stage: "Shortlisted", 
        count: data.shortlisted_for_interview, 
        fill: "var(--color-shortlisted)" 
      },
      { 
        stage: "Interviewed", 
        count: data.interviews_completed, 
        fill: "var(--color-interviewed)" 
      },
      { 
        stage: "Offers Extended", 
        count: data.offers_extended, 
        fill: "var(--color-offered)" 
      },
    ];
  }, [data]);

  const chartConfig = {
    count: {
      label: "Candidates",
    },
    screened: {
      label: "Candidates Screened",
      color: "#3b82f6", // blue-500
    },
    shortlisted: {
      label: "Shortlisted",
      color: "#f59e0b", // amber-500
    },
    interviewed: {
      label: "Interviewed",
      color: "#10b981", // emerald-500
    },
    offered: {
      label: "Offers Extended",
      color: "#8b5cf6", // violet-500
    },
  } satisfies ChartConfig;

  const totalCandidates = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [chartData])

  const conversionRate = React.useMemo(() => {
    if (!data || data.candidates_screened === 0) return 0;
    return ((data.offers_extended / data.candidates_screened) * 100).toFixed(1);
  }, [data]);

  const stages = [
    {
      label: "Screened",
      value: data?.candidates_screened || 0,
      icon: Users,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200"
    },
    {
      label: "Shortlisted",
      value: data?.shortlisted_for_interview || 0,
      icon: UserCheck,
      color: "bg-amber-500",
      lightColor: "bg-amber-50",
      textColor: "text-amber-700",
      borderColor: "border-amber-200"
    },
    {
      label: "Interviewed",
      value: data?.interviews_completed || 0,
      icon: Briefcase,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-200"
    },
    {
      label: "Offered",
      value: data?.offers_extended || 0,
      icon: Award,
      color: "bg-violet-500",
      lightColor: "bg-violet-50",
      textColor: "text-violet-700",
      borderColor: "border-violet-200"
    }
  ];

  if (loading || !data || !isValidSchoolId) {
    return (
      <Card className="h-full border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            {!isValidSchoolId ? (
              <p className="text-sm text-gray-600">No school selected. Please select a school to view hiring progress.</p>
            ) : (
              <>
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading hiring progress...</p>
              </>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border border-gray-200 h-full overflow-hidden py-0 pt-4 justify-between shadow-none">
      {/* Header with Gradient */}
      <CardHeader className="border-b border-gray-200 pb-2">
            <CardTitle className="text-md font-bold text-gray-900">
              Hiring Progress Overview
            </CardTitle>
            <p className="text-sm text-gray-600">Track your recruitment pipeline</p>
      </CardHeader>

      <CardContent className="">
          {/* Chart Section */}
            <ChartContainer
              config={chartConfig}
              className="mx-auto w-full"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="stage"
                  innerRadius={70}
                  outerRadius={100}
                  strokeWidth={2}
                  stroke="#fff"
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <g>
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) - 10}
                                className="fill-gray-900 text-4xl font-bold"
                              >
                                {totalCandidates.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 20}
                                className="fill-gray-600 text-sm font-medium"
                              >
                                Total Candidates
                              </tspan>
                            </text>
                          </g>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

       
      </CardContent>

      <CardFooter className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-violet-500 rounded-full"></div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Pipeline Stages</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stages.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                  <div className={`w-2 h-2 ${stage.color} rounded-full flex-shrink-0`}></div>
                  <span className="text-xs text-gray-700 font-medium truncate">{stage.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default HiringProgressChart;