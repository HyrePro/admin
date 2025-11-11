import { createClient } from "./client"
import { type SupabaseClient } from '@supabase/supabase-js'

export interface InterviewSchedule {
  first_name: string;
  last_name: string;
  start_time: string; // time without time zone
  interview_date: string; // date
  created_by: string; // uuid
  panelists: Array<{
    id: string;
    name: string;
    email: string;
  }> | null;
  interview_type: string;
  status: string;
  job_title: string;
}

export async function getInterviewSchedule(
  schoolId: string,
  startDate: string,
  endDate: string,
  type: number = 1,
  userId: string | null = null,
  jobId: string | null = null
) {
  // Create the supabase client instance
  const supabase: SupabaseClient = createClient()
  
  try {
    // Validate parameters
    if (!schoolId || typeof schoolId !== 'string') {
      throw new Error('Invalid school ID')
    }
    
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required')
    }
    
    // Call the RPC function
    const { data, error } = await supabase.rpc("get_interview_schedule_report", {
      p_school_id: schoolId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_type: type,
      p_user_id: userId,
      p_job_id: jobId
    });

    if (error) {
      throw new Error(error.message || "Failed to fetch interview schedule");
    }
    
    return { data: data as InterviewSchedule[], error: null };
  } catch (err) {
    console.error("Error fetching interview schedule:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}