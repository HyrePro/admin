"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import { useAuthStore } from "@/store/auth-store"

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
import { createClient } from "@/lib/supabase/api/client"

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
  
  const [data, setData] = React.useState<HiringProgressData | null>({} as HiringProgressData);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc('get_hiring_progress', { p_school_id: effectiveSchoolId });
      
      if(error) console.error(error);
      console.log(data[0])
      setData(data[0]);
      setLoading(false);
    };
    
    fetchData();
  }, [effectiveSchoolId]);

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
      color: "#f97316", // orange-500
    },
    interviewed: {
      label: "Interviewed",
      color: "#22c55e", // green-500
    },
    offered: {
      label: "Offers Extended",
      color: "#8b5cf6", // violet-500
    },
  } satisfies ChartConfig;

  const totalCandidates = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [chartData])

  if (loading || !data) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 gap-2 py-4 px-4 flex flex-col border-1 border-gray-200 shadow-none h-full">
      <div className="items-center pb-0">
        <CardTitle>Overall Hiring Progress</CardTitle>
      </div>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
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
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalCandidates.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Candidates
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-700">Candidates Screened</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-sm text-gray-700">Shortlisted for Interview</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-700">Interviews Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-violet-500"></div>
            <span className="text-sm text-gray-700">Offers Extended</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default HiringProgressChart;