"use client";

import * as React from "react";

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  LabelList,
  Cell,
  Pie,
  PieChart,
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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { createClient } from "@/lib/supabase/api/client";
import { getMcqAssessmentAnalytics, type MCQAssessmentAnalytics } from "@/lib/supabase/api/get-mcq-assessment-analytics";
import type { JobOverviewAnalytics, JobFunnelAnalytics } from "@/lib/supabase/api/get-job-analytics";
import { TotalAnalytics } from '@/components/total-analytics';
import { AssessmentAnalytics } from '@/components/assessment-analytics';
import { InterviewAnalytics } from '@/components/interview-analytics';
import { JobFunnelVisualizations } from '@/components/job-funnel-visualizations';
import { DemoAnalytics } from '@/components/demo-analytics';
import { getDemoAnalytics, type DemoAnalytics as DemoAnalyticsType } from '@/lib/supabase/api/get-demo-analytics';
import { getInterviewAnalytics, type InterviewAnalytics as InterviewAnalyticsType } from '@/lib/supabase/api/get-interview-analytics';

interface JobOverviewAnalyticsProps {
  jobId: string;
}

// Extended interface to include demographics
interface JobFunnelAnalyticsWithDemographics extends JobFunnelAnalytics {
  demographics?: {
    gender?: {
      male: number;
      female: number;
      other: number;
    };
    city_distribution?: Record<string, number>;
  };
}

const chartConfig = {
  passed: {
    label: "Passed",
    color: "#10b981", // Green
  },
  failed: {
    label: "Failed",
    color: "#ef4444", // Red
  },
  scheduled: {
    label: "Scheduled",
    color: "#f59e0b", // Amber
  },
  completed: {
    label: "Completed",
    color: "#8b5cf6", // Violet
  },
  total: {
    label: "Total",
    color: "#3b82f6", // Blue
  },
  assessment: {
    label: "Assessment",
    color: "#3b82f6", // Blue
  },
  demo: {
    label: "Demo",
    color: "#10b981", // Green
  },
  interview: {
    label: "Interview",
    color: "#f59e0b", // Amber
  },
  hired: {
    label: "Hired",
    color: "#8b5cf6", // Violet
  },
  dropoff: {
    label: "Drop-off",
    color: "#6b7280", // Gray
  },
  avg_percentage: {
    label: "Average Percentage",
    color: "#8b5cf6", // Violet
  },
} satisfies ChartConfig;

export function JobOverviewAnalytics({ jobId }: JobOverviewAnalyticsProps) {
  const [overviewData, setOverviewData] = React.useState<JobOverviewAnalytics | null>(null);
  const [funnelData, setFunnelData] = React.useState<JobFunnelAnalytics | null>(null);
  const [demographicsData, setDemographicsData] = React.useState<JobFunnelAnalyticsWithDemographics['demographics'] | null>(null); // Will contain gender and city distribution
  const [mcqAssessmentData, setMcqAssessmentData] = React.useState<MCQAssessmentAnalytics | null>(null);
  const [demoAnalyticsData, setDemoAnalyticsData] = React.useState<DemoAnalyticsType | null>(null);
  const [interviewAnalyticsData, setInterviewAnalyticsData] = React.useState<InterviewAnalyticsType | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingAssessment, setLoadingAssessment] = React.useState(false);
  const [loadingDemo, setLoadingDemo] = React.useState(false);
  const [loadingInterview, setLoadingInterview] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = React.useState<string>('total'); // Default to 'total'

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch both overview and funnel data
        // Fetch overview data using direct Supabase call
        const supabase = createClient();
        const { data: overviewData, error: overviewError } = await supabase
          .rpc('get_job_analytics', {
            p_job_id: jobId,
            p_type: 'overview'
          });
        
        if (overviewError) {
          throw new Error(overviewError.message || 'Failed to fetch overview analytics');
        }
        
        // Fetch funnel data using direct Supabase call
        const { data: funnelData, error: funnelError } = await supabase
          .rpc('get_funnel_analytics', {
            p_job_id: jobId
          });
        
        if (funnelError) {
          throw new Error(funnelError.message || 'Failed to fetch funnel analytics');
        }
        
        setOverviewData(overviewData as JobOverviewAnalytics);
        setFunnelData(funnelData as JobFunnelAnalyticsWithDemographics);
        
        // Mock demographics data - in a real implementation, this would be fetched from an API
        const mockDemographics = {
          gender: {
            male: 45,
            female: 32,
            other: 5
          },
          city_distribution: {
            'Bangalore': 18,
            'Dharwad': 2,
            'Hubballi': 2,
            'Mysore': 7,
            'Mangalore': 4,
            'Chennai': 12
          }
        };
        setDemographicsData(mockDemographics);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchData();
    }
  }, [jobId]);

  // Fetch MCQ assessment data when Assessment metric is selected
  React.useEffect(() => {
    if (selectedMetric === 'assessment' && jobId && !mcqAssessmentData) {
      const fetchAssessmentData = async () => {
        setLoadingAssessment(true);
        try {
          const result = await getMcqAssessmentAnalytics(jobId);
          if (result.error) {
            console.error("Error fetching MCQ assessment data:", result.error);
          } else {
            setMcqAssessmentData(result.data);
          }
        } catch (err) {
          console.error("Error in fetching MCQ assessment data:", err);
        } finally {
          setLoadingAssessment(false);
        }
      };

      fetchAssessmentData();
    }
  }, [selectedMetric, jobId, mcqAssessmentData]);

  // Fetch demo analytics data when Demo metric is selected
  React.useEffect(() => {
    if (selectedMetric === 'demo' && jobId && !demoAnalyticsData) {
      const fetchDemoData = async () => {
        setLoadingDemo(true);
        try {
          const result = await getDemoAnalytics(jobId);
          if (result.error) {
            console.error("Error fetching demo analytics data:", result.error);
          } else {
            setDemoAnalyticsData(result.data);
          }
        } catch (err) {
          console.error("Error in fetching demo analytics data:", err);
        } finally {
          setLoadingDemo(false);
        }
      };

      fetchDemoData();
    }
  }, [selectedMetric, jobId, demoAnalyticsData]);

  // Fetch interview analytics data when Interview metric is selected
  React.useEffect(() => {
    if (selectedMetric === 'interview' && jobId && !interviewAnalyticsData) {
      const fetchInterviewData = async () => {
        setLoadingInterview(true);
        try {
          const result = await getInterviewAnalytics(jobId);
          if (result.error) {
            console.error("Error fetching interview analytics data:", result.error);
          } else {
            setInterviewAnalyticsData(result.data);
          }
        } catch (err) {
          console.error("Error in fetching interview analytics data:", err);
        } finally {
          setLoadingInterview(false);
        }
      };

      fetchInterviewData();
    }
  }, [selectedMetric, jobId, interviewAnalyticsData]);



  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading KPI metrics */}
        <div className="border rounded-lg rounded-b-none">
          <div className="flex justify-between">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex-1 ${i > 0 ? 'border-l' : ''} p-4`}>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mt-2" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Loading chart */}
        <div className="h-[400px] bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="p-4 border rounded-lg bg-red-50">
          <p className="text-red-800">Failed to load job analytics: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div className="space-y-6">
        <div className="p-4 border rounded-lg bg-yellow-50">
          <p className="text-yellow-800">No analytics data available for this job yet.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate pass rates based on overview data
  const assessmentPassRate = overviewData.total_applicants > 0 
    ? ((overviewData.assessment_completed / overviewData.total_applicants) * 100).toFixed(1) 
    : 0;
    
  const demoPassRate = overviewData.total_applicants > 0 
    ? ((overviewData.demos_completed / overviewData.total_applicants) * 100).toFixed(1) 
    : 0;
    
  const interviewCompletionRate = overviewData.total_applicants > 0 
    ? ((overviewData.interviews_completed / overviewData.total_applicants) * 100).toFixed(1) 
    : 0;

  return (
    <div className="pb-8">
      {/* KPI metrics with common border and individual left borders, selected metric without bottom border */}
      <div className="border rounded-lg rounded-b-none">
        <div className="flex justify-between">
          <div 
            className={`flex-1 p-4 ${selectedMetric === 'total' ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer transition-colors ${selectedMetric === 'total' ? 'rounded-b-none' : ''}`}
            onClick={() => setSelectedMetric('total')}
          >
            <h3 className="font-medium">Total</h3>
            <p className="text-2xl font-bold">
              {overviewData.total_applicants}
            </p>
            <p className="text-xs text-gray-500 mt-1">
            </p>
          </div>
          
          <div 
            className={`flex-1 border-l p-4 ${selectedMetric === 'assessment' ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer transition-colors ${selectedMetric === 'assessment' ? 'rounded-b-none' : ''}`}
            onClick={() => setSelectedMetric('assessment')}
          >
            <h3 className="font-medium">Assessment</h3>
            <p className="text-2xl font-bold">
              {overviewData.assessment_completed}
            </p>
            <p className="text-xs text-gray-500 mt-1">
            </p>
          </div>
          
          <div 
            className={`flex-1 border-l p-4 ${selectedMetric === 'demo' ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer transition-colors ${selectedMetric === 'demo' ? 'rounded-b-none' : ''}`}
            onClick={() => setSelectedMetric('demo')}
          >
            <h3 className="font-medium">Demo</h3>
            <p className="text-2xl font-bold">
              {overviewData.demos_completed}
            </p>
            <p className="text-xs text-gray-500 mt-1">
            </p>
          </div>
          
          <div 
            className={`flex-1 border-l p-4 ${selectedMetric === 'interview' ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer transition-colors ${selectedMetric === 'interview' ? 'rounded-b-none' : ''}`}
            onClick={() => setSelectedMetric('interview')}
          >
            <h3 className="font-medium">Interview</h3>
            <p className="text-2xl font-bold">
              {overviewData.interviews_completed}
            </p>
            <p className="text-xs text-gray-500 mt-1">
            </p>
          </div>
        </div>
      </div>

      {/* Funnel visualization that updates based on selected metric with borders on bottom, left, and right */}
      {selectedMetric === 'total' && (
        <TotalAnalytics funnelData={
          funnelData 
        }/>
      )}
      {selectedMetric === 'assessment' && (
        <AssessmentAnalytics 
          jobId={jobId} 
          chartConfig={chartConfig} 
          mcqAssessmentData={mcqAssessmentData}
          loadingAssessment={loadingAssessment}
          setLoadingAssessment={setLoadingAssessment}
        />
      )}
      {selectedMetric === 'demo' && (
        <DemoAnalytics 
          jobId={jobId} 
          chartConfig={chartConfig} 
          demoAnalyticsData={demoAnalyticsData}
          loadingDemo={loadingDemo}
          setLoadingDemo={setLoadingDemo}
        />
      )}
      {selectedMetric === 'interview' && (
        <InterviewAnalytics 
          jobId={jobId} 
          chartConfig={chartConfig} 
          interviewAnalyticsData={interviewAnalyticsData}
          loadingInterview={loadingInterview}
          setLoadingInterview={setLoadingInterview}
        />
      )}
      
    
    </div>
  );
}