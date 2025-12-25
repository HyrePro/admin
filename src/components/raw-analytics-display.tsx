"use client";

import * as React from "react";
import { getJobAnalytics } from "@/lib/supabase/api/get-job-analytics";
import type { JobOverviewAnalytics, JobFunnelAnalytics } from "@/lib/supabase/api/get-job-analytics";

interface RawAnalyticsDisplayProps {
  jobId: string;
}

export function RawAnalyticsDisplay({ jobId }: RawAnalyticsDisplayProps) {
  const [overviewData, setOverviewData] = React.useState<JobOverviewAnalytics | null>(null);
  const [funnelData, setFunnelData] = React.useState<JobFunnelAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    console.log('RawAnalyticsDisplay: Fetching data for jobId:', jobId);
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch both overview and funnel data
        console.log('Fetching overview data...');
        const overviewResult = await getJobAnalytics(jobId, 'overview');
        console.log('Overview result:', overviewResult);
        
        if (overviewResult.error) {
          console.error('Overview error:', overviewResult.error);
          throw new Error(overviewResult.error);
        }
        
        console.log('Fetching funnel data...');
        const funnelResult = await getJobAnalytics(jobId, 'funnel');
        console.log('Funnel result:', funnelResult);
        
        if (funnelResult.error) {
          console.error('Funnel error:', funnelResult.error);
          throw new Error(funnelResult.error);
        }

        setOverviewData(overviewResult.data as JobOverviewAnalytics);
        setFunnelData(funnelResult.data as JobFunnelAnalytics);
        
        console.log('Setting overview data:', overviewResult.data);
        console.log('Setting funnel data:', funnelResult.data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchData();
    } else {
      console.error('RawAnalyticsDisplay: No jobId provided');
      setError('No jobId provided');
      setLoading(false);
    }
  }, [jobId]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Raw Analytics Data (Loading...)</h3>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-red-800">Error Loading Analytics</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-6">
      <h3 className="text-lg font-semibold">Raw Analytics Data</h3>
      
      <div>
        <h4 className="font-medium text-gray-700 mb-2">Overview Data:</h4>
        <pre className="bg-white p-4 rounded border text-sm overflow-auto max-h-60">
          {JSON.stringify(overviewData, null, 2)}
        </pre>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-700 mb-2">Funnel Data:</h4>
        <pre className="bg-white p-4 rounded border text-sm overflow-auto max-h-60">
          {JSON.stringify(funnelData, null, 2)}
        </pre>
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-2">Data Summary:</h4>
        <ul className="text-sm space-y-1">
          <li><strong>Overview total applicants:</strong> {overviewData?.total_applicants || 0}</li>
          <li><strong>Overview assessment completed:</strong> {overviewData?.assessment_completed || 0}</li>
          <li><strong>Overview demos completed:</strong> {overviewData?.demos_completed || 0}</li>
          <li><strong>Overview interviews completed:</strong> {overviewData?.interviews_completed || 0}</li>
          {funnelData && (
            <>
              <li><strong>Funnel applications submitted:</strong> {funnelData.stages?.applications_submitted || 0}</li>
              <li><strong>Funnel assessment passed:</strong> {funnelData.stages?.assessment_passed || 0}</li>
              <li><strong>Funnel assessment failed:</strong> {funnelData.stages?.assessment_failed || 0}</li>
              <li><strong>Funnel demo passed:</strong> {funnelData.stages?.demo_passed || 0}</li>
              <li><strong>Funnel demo failed:</strong> {funnelData.stages?.demo_failed || 0}</li>
              <li><strong>Funnel interview scheduled:</strong> {funnelData.stages?.interview_scheduled || 0}</li>
              <li><strong>Funnel interview completed:</strong> {funnelData.stages?.interview_completed || 0}</li>
              <li><strong>Funnel hired:</strong> {funnelData.stages?.hired || 0}</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}