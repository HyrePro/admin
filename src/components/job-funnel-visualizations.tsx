
import * as React from "react";
import * as RechartsPrimitive from "recharts";

import {
  Funnel,
  FunnelChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Pie,
  PieChart,
  Cell,
  LabelList
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
  ChartTooltipContent,
} from "@/components/ui/chart";

interface FunnelData {
  stages?: {
    applications_submitted?: number;
    assessment_started?: number;
    assessment_passed?: number;
    demo_submitted?: number;
    demo_passed?: number;
    interview_scheduled?: number;
    interview_completed?: number;
    offers_extended?: number;
    hired?: number;
  };
  demographics?: {
    gender?: {
      male: number;
      female: number;
      other: number;
    };
    city_distribution?: Record<string, number>;
  };
}

interface JobFunnelVisualizationsProps {
  funnelData: FunnelData;
  chartConfig: ChartConfig;
}

// Define the data structure for the funnel chart
interface FunnelStage {
  name: string;
  value: number;
  color: string;
}

// Define the data structure for the gender distribution chart
interface GenderData {
  name: string;
  value: number;
  color: string;
}

// Define the data structure for the city distribution chart
interface CityData {
  name: string;
  value: number;
  color: string;
}

// Prepare funnel chart data from the stages
export const prepareFunnelData = (stages: {
  applications_submitted?: number;
  assessment_started?: number;
  assessment_passed?: number;
  demo_submitted?: number;
  demo_passed?: number;
  interview_scheduled?: number;
  interview_completed?: number;
  offers_extended?: number;
  hired?: number;
} | undefined): FunnelStage[] => {
  if (!stages) return [];
  
  return [
    { name: 'Applications', value: stages.applications_submitted || 0, color: '#60a5fa' },
    { name: 'Assessment Started', value: stages.assessment_started || 0, color: '#3b82f6' },
    { name: 'Assessment Passed', value: stages.assessment_passed || 0, color: '#2563eb' },
    { name: 'Demo Submitted', value: stages.demo_submitted || 0, color: '#10b981' },
    { name: 'Demo Passed', value: stages.demo_passed || 0, color: '#059669' },
    { name: 'Interview Scheduled', value: stages.interview_scheduled || 0, color: '#f59e0b' },
    { name: 'Interview Completed', value: stages.interview_completed || 0, color: '#d97706' },
    { name: 'Offers Extended', value: stages.offers_extended || 0, color: '#8b5cf6' },
    { name: 'Hired', value: stages.hired || 0, color: '#7c3aed' },
  ].filter(item => item.value > 0);
};

// Prepare gender distribution data
export const prepareGenderData = (demographics: { gender?: { male: number; female: number; other: number } } | undefined): GenderData[] => {
  if (!demographics || !demographics.gender) return [];
  
  const { male, female, other } = demographics.gender;
  return [
    { name: 'Male', value: male || 0, color: '#3b82f6' },
    { name: 'Female', value: female || 0, color: '#ef4444' },
    { name: 'Other', value: other || 0, color: '#8b5cf6' },
  ].filter(item => item.value > 0);
};

// Prepare city distribution data with color intensity based on values
export const prepareCityData = (demographics: { city_distribution?: Record<string, number> } | undefined): CityData[] => {
  if (!demographics || !demographics.city_distribution) return [];
  
  const cityDistribution = demographics.city_distribution;
  const values = Object.values(cityDistribution || {}).map(Number);
  const maxValue = Math.max(...values, 1); // Avoid division by zero
  
  return Object.entries(cityDistribution || {}).map(([city, value]) => {
    // Calculate color intensity based on the value relative to the max value
    const intensity = Math.max(0.2, Math.min(0.9, (Number(value) / maxValue) * 0.7 + 0.3));
    // Create a base color (blue) and adjust its lightness based on the intensity
    const hue = 210; // Blue hue
    const saturation = 70; // 70% saturation
    const lightness = Math.round(intensity * 100); // Lightness based on intensity
    
    return {
      name: city,
      value: Number(value),
      color: `hsl(${hue}, ${saturation}%, ${lightness}%)`
    };
  });
};

export function JobFunnelVisualizations({ funnelData, chartConfig }: JobFunnelVisualizationsProps) {
  const funnelChartData = React.useMemo(() => prepareFunnelData(funnelData?.stages || {}), [funnelData?.stages]);
  const genderData = React.useMemo(() => prepareGenderData(funnelData?.demographics), [funnelData?.demographics]);
  const cityData = React.useMemo(() => prepareCityData(funnelData?.demographics), [funnelData?.demographics]);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Funnel Chart */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Hiring Funnel</CardTitle>
          <CardDescription>Application stages distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip content={<ChartTooltipContent />} />
                <Funnel
                  dataKey="value"
                  data={funnelChartData}
                  isAnimationActive
                >
                  {funnelChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList position="right" dataKey="name" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      
      {/* Gender Distribution Pie Chart */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Gender Distribution</CardTitle>
          <CardDescription>Distribution of candidates by gender</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltipContent />} />
                <RechartsPrimitive.Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      
      {/* City Distribution Bar Chart */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>City Distribution</CardTitle>
          <CardDescription>Candidates by city (intensity-based coloring)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cityData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  content={<ChartTooltipContent />} 
                  formatter={(value) => [value, 'Candidates']}
                />
                <Bar dataKey="value" name="Candidates">
                  {cityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}