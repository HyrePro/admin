import { createClient } from "./client"
import { type SupabaseClient } from '@supabase/supabase-js'

export interface AssessmentMonitoringLog {
  id: string;
  job_application_id: string;
  event_type: string;
  event_details: string;
  created_at: string;
  violation_type: string | null;
  captured_at: string | null;
  image_path: string | null;
}

export async function getAssessmentMonitoringLogs(applicationId: string) {
  // Create the supabase client instance
  const supabase: SupabaseClient = createClient()
  
  try {
    const { data, error } = await supabase
      .from("assessment_monitoring_logs")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message || "Failed to fetch monitoring logs");
    }

    return { data: data as AssessmentMonitoringLog[], error: null };
  } catch (err) {
    console.error("Error fetching assessment monitoring logs:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}