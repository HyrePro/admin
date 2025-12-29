"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSchoolKPIs } from "@/lib/supabase/api/kpiService";
import type { SchoolKPIs as SchoolKPIsType } from "@/lib/supabase/api/kpiService";
import { MetricCard, MetricItem } from "@/components/analytic-dashboard-card";

interface SchoolKPIsProps {
  schoolId: string;
}

export function SchoolKPIs({ schoolId }: SchoolKPIsProps) {
  const [kpis, setKpis] = useState<SchoolKPIsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        const data = await getSchoolKPIs(schoolId, period);
        setKpis(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching KPIs:", err);
        setError("Failed to load KPIs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      fetchKPIs();
    }
  }, [schoolId, period]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading KPIs...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">{error}</div>;
  }

  if (!kpis) {
    return <div className="flex justify-center items-center h-64">No data available</div>;
  }

  // Prepare metric items for each card
  const totalJobsItems: MetricItem[] = [
    {
      key: 'active-campaigns',
      label: 'Active Campaigns',
      value: kpis.total_active_campaigns ?? 0,
      delta: kpis.total_successful_campaigns ?? 0,
      description: 'Total number of active job campaigns'
    },
    {
      key: 'successful-campaigns',
      label: 'Successful Campaigns',
      value: kpis.total_successful_campaigns ?? 0,
      delta: kpis.total_failed_campaigns ? -(kpis.total_failed_campaigns) : 0,
      description: 'Successfully completed job campaigns'
    },
    {
      key: 'failed-campaigns',
      label: 'Failed Campaigns',
      value: kpis.total_failed_campaigns ?? 0,
      delta: kpis.total_failed_campaigns ?? 0,
      description: 'Job campaigns that did not complete successfully'
    }
  ];

  const totalApplicationsItems: MetricItem[] = [
    {
      key: 'assessment-eligible',
      label: 'Assessment Eligible',
      value: kpis.candidates_assessment_stage ?? 0,
      delta: kpis.total_failed_campaigns ?? 0,
      description: 'Candidates eligible for assessment stage'
    },
    {
      key: 'interview-eligible',
      label: 'Interview Eligible',
      value: kpis.candidates_interview_stage ?? 0,
      delta: kpis.total_failed_campaigns ? -(kpis.total_failed_campaigns) : 0,
      description: 'Candidates eligible for interview stage'
    },
    {
      key: 'offered-candidates',
      label: 'Offered',
      value: kpis.candidates_offered ?? 0,
      delta: kpis.total_failed_campaigns ?? 0,
      description: 'Candidates who received job offers'
    }
  ];

  const offeredItems: MetricItem[] = [
    {
      key: 'time-to-hire',
      label: 'Avg. Time to Hire',
      value: kpis.avg_time_to_hire ?? 0,
      delta: kpis.total_failed_campaigns ?? 0,
      description: 'Average number of days to hire'
    },
    {
      key: 'offer-accepted',
      label: 'Offer Accepted',
      value: kpis.offer_extended_vs_accepted ? parseFloat(kpis.offer_extended_vs_accepted.toFixed(2)) : 0,
      delta: kpis.total_failed_campaigns ? -(kpis.total_failed_campaigns) : 0,
      description: 'Percentage of offers accepted'
    },
    {
      key: 'offer-declined',
      label: 'Offer Declined',
      value: kpis.offer_extended_vs_declined ? parseFloat(kpis.offer_extended_vs_declined.toFixed(2)) : 0,
      delta: kpis.total_failed_campaigns ?? 0,
      description: 'Percentage of offers declined'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">School Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <span>Filter by period:</span>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 mt-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <MetricCard 
          title="Total Jobs" 
          value={kpis.total_active_campaigns ?? 0} 
          delta={kpis.total_successful_campaigns ?? 0}
          description='Total number of job campaigns created.'
          items={totalJobsItems}
        />
        
        <MetricCard 
          title="Total Applications" 
          value={kpis.candidates_assessment_stage + kpis.candidates_interview_stage + kpis.candidates_offered} 
          delta={kpis.total_successful_campaigns ?? 0}
          description='Total number of candidates who have applied for jobs.'
          items={totalApplicationsItems}
        />
        
        <MetricCard 
          title="Offered" 
          value={kpis.candidates_offered ?? 0} 
          delta={kpis.total_successful_campaigns ?? 0}
          description='Number of candidates who have been offered a job.'
          items={offeredItems}
        />
      </div>
    </div>
  );
}