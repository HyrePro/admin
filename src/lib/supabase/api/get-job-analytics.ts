import { createClient } from "./client";

export interface JobOverviewAnalytics {
  type: string;
  job_id: string;
  generated_at: string;
  demos_completed: number;
  total_applicants: number;
  assessment_completed: number;
  interviews_completed: number;
}

export interface JobFunnelAnalytics {
  type: string;
  job_id: string;
  stages: {
    hired: number;
    appealed: number;
    rejected: number;
    suspended: number;
    demo_failed: number;
    demo_passed: number;
    demo_submitted: number;
    offers_extended: number;
    assessment_failed: number;
    assessment_passed: number;
    assessment_started: number;
    interview_completed: number;
    interview_scheduled: number;
    applications_submitted: number;
  };
  generated_at: string;
  conversion_rates: {
    hire_rate: number;
    offer_rate: number;
    demo_pass_rate: number;
    assessment_pass_rate: number;
    demo_submission_rate: number;
    interview_conversion: number;
    application_to_assessment: number;
  };
  total_applicants: number;
}

export async function getJobAnalytics(
  jobId: string,
  type: 'overview' | 'funnel'
): Promise<{ data: JobOverviewAnalytics | JobFunnelAnalytics | null; error: string | null }> {
  // Create the supabase client instance

  try {
    // Validate jobId format (basic UUID validation)
    if (!jobId || typeof jobId !== 'string' || jobId.length < 36) {
      throw new Error('Invalid job ID format');
    }

    // Validate type
    if (!['overview', 'funnel'].includes(type)) {
      throw new Error('Invalid type. Valid values are: overview, funnel');
    }

    const response = await fetch(`/api/job-analytics?jobId=${jobId}&type=${type}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch ${type} analytics`);
    }

    const data = await response.json();
    return { data: data as (JobOverviewAnalytics | JobFunnelAnalytics), error: null };
  } catch (err) {
    console.error(`Error fetching ${type} analytics:`, err);
    return {
      data: null,
      error: err instanceof Error ? err.message : `An unexpected error occurred while fetching ${type} analytics`,
    };
  }
}