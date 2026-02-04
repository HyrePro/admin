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
import type { JobOverviewAnalytics as JobOverviewAnalyticsType, JobFunnelAnalytics } from "@/lib/supabase/api/get-job-analytics";
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

const JobOverviewAnalyticsComponent = ({ jobId }: JobOverviewAnalyticsProps) => {
  const [overviewData, setOverviewData] = React.useState<JobOverviewAnalyticsType | null>(null);
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
  const [assessmentError, setAssessmentError] = React.useState<string | null>(null);
  const [demoError, setDemoError] = React.useState<string | null>(null);
  const [interviewError, setInterviewError] = React.useState<string | null>(null);
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
        
        console.log('Component - Overview RPC response:', { data: overviewData, error: overviewError });
        
        if (overviewError) {
          console.error('Component - Overview RPC error:', overviewError);
          throw new Error(overviewError.message || 'Failed to fetch overview analytics');
        }
        
        // Fetch funnel data using direct Supabase call
        const { data: funnelData, error: funnelError } = await supabase
          .rpc('get_funnel_analytics', {
            p_job_id: jobId
          });
        
        console.log('Component - Funnel RPC response:', { data: funnelData, error: funnelError });
        
        if (funnelError) {
          console.error('Component - Funnel RPC error:', funnelError);
          throw new Error(funnelError.message || 'Failed to fetch funnel analytics');
        }
        
        // Ensure data is properly serialized to avoid non-serializable object errors
        const processedOverviewData = overviewData ?? null;
        const processedFunnelData = funnelData ?? null;
        
        console.log('Component - Processed overview data:', processedOverviewData);
        console.log('Component - Processed funnel data:', processedFunnelData);
        
        // Check if data exists before setting state
        const hasOverviewData = processedOverviewData !== null;
        const hasFunnelData = processedFunnelData !== null;
        
        console.log('Component - Data availability check:', { hasOverviewData, hasFunnelData });
        
        setOverviewData(hasOverviewData ? JSON.parse(JSON.stringify(processedOverviewData)) : null);
        setFunnelData(hasFunnelData ? JSON.parse(JSON.stringify(processedFunnelData)) : null);
        
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
        setAssessmentError(null);
        try {
          const result = await getMcqAssessmentAnalytics(jobId);
          if (result.error) {
            console.error("Error fetching MCQ assessment data:", result.error);
            setAssessmentError(result.error || "Failed to fetch assessment analytics");
          } else {
            // Ensure data is properly serialized to avoid non-serializable object errors
            setMcqAssessmentData(result.data ? JSON.parse(JSON.stringify(result.data)) : null);
          }
        } catch (err) {
          console.error("Error in fetching MCQ assessment data:", err);
          setAssessmentError(err instanceof Error ? err.message : "Failed to fetch assessment analytics");
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
        setDemoError(null);
        try {
          const result = await getDemoAnalytics(jobId);
          if (result.error) {
            console.error("Error fetching demo analytics data:", result.error);
            setDemoError(result.error || "Failed to fetch demo analytics");
          } else {
            // Ensure data is properly serialized to avoid non-serializable object errors
            setDemoAnalyticsData(result.data ? JSON.parse(JSON.stringify(result.data)) : null);
          }
        } catch (err) {
          console.error("Error in fetching demo analytics data:", err);
          setDemoError(err instanceof Error ? err.message : "Failed to fetch demo analytics");
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
        setInterviewError(null);
        try {
          const result = await getInterviewAnalytics(jobId);
          if (result.error) {
            console.error("Error fetching interview analytics data:", result.error);
            setInterviewError(result.error || "Failed to fetch interview analytics");
          } else {
            // Ensure data is properly serialized to avoid non-serializable object errors
            setInterviewAnalyticsData(result.data ? JSON.parse(JSON.stringify(result.data)) : null);
          }
        } catch (err) {
          console.error("Error in fetching interview analytics data:", err);
          setInterviewError(err instanceof Error ? err.message : "Failed to fetch interview analytics");
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
        <div className="border-b">
          <div className="flex justify-between divide-x">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-1 p-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mt-2" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Loading chart */}
        <div className="h-[400px] bg-gray-200 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-red-50">
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
        <div className="p-4 bg-yellow-50">
          <p className="text-yellow-800">No analytics data available for this job yet.</p>
          <p className="text-yellow-600 mt-2">Job ID: {jobId}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-blue-600">Show Debug Info</summary>
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
              <pre>Overview Data: {JSON.stringify(overviewData, null, 2)}</pre>
              <pre>Funnel Data: {JSON.stringify(funnelData, null, 2)}</pre>
            </div>
          </details>
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
    <div className="h-full flex flex-col">
      {/* KPI metrics with common border and individual left borders */}
      <div className="shrink-0 border-b">
        <div className="flex justify-between divide-x">
          <div 
            className={`flex-1 p-4 ${selectedMetric === 'total' ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer transition-colors`}
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
            className={`flex-1 p-4 ${selectedMetric === 'assessment' ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer transition-colors`}
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
            className={`flex-1 p-4 ${selectedMetric === 'demo' ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer transition-colors`}
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
            className={`flex-1 p-4 ${selectedMetric === 'interview' ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer transition-colors`}
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

      {/* Content scroll area */}
      <div className="flex-1 overflow-y-auto">
        <div className="pb-8">
          {selectedMetric === 'total' && (
            <TotalAnalytics funnelData={funnelData} loading={false} error={null} />
          )}
          {selectedMetric === 'assessment' && (
            <AssessmentAnalytics 
              jobId={jobId} 
              chartConfig={chartConfig} 
              mcqAssessmentData={mcqAssessmentData}
              loadingAssessment={loadingAssessment}
              setLoadingAssessment={setLoadingAssessment}
              errorAssessment={assessmentError}
            />
          )}
          {selectedMetric === 'demo' && (
            <DemoAnalytics 
              jobId={jobId} 
              chartConfig={chartConfig} 
              demoAnalyticsData={demoAnalyticsData}
              loadingDemo={loadingDemo}
              setLoadingDemo={setLoadingDemo}
              errorDemo={demoError}
            />
          )}
          {selectedMetric === 'interview' && (
            <InterviewAnalytics 
              jobId={jobId} 
              chartConfig={chartConfig} 
              interviewAnalyticsData={interviewAnalyticsData}
              loadingInterview={loadingInterview}
              setLoadingInterview={setLoadingInterview}
              errorInterview={interviewError}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const JobOverviewAnalytics = React.memo(JobOverviewAnalyticsComponent);
