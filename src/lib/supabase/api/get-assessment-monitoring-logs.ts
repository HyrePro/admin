import { supabase } from "./client";

export interface AssessmentMonitoringLog {
  id: string;
  user_id: string | null;
  application_id: string | null;
  job_id: string | null;
  image_path: string | null;
  captured_at: string | null;
  violation_type: string | null;
  created_at: string | null;
}

export async function getAssessmentMonitoringLogs(applicationId: string) {
  try {
    const { data, error } = await supabase
      .from('assessment_monitoring_logs')
      .select('*')
      .eq('application_id', applicationId)
      .order('captured_at', { ascending: false });

    if (error) {
      throw new Error(error.message || "Failed to fetch assessment monitoring logs");
    }

    return {
      data: data as AssessmentMonitoringLog[] || [],
      error: null
    };
  } catch (err) {
    console.error("Error fetching assessment monitoring logs:", err);
    return {
      data: [],
      error: err instanceof Error ? err.message : "An unexpected error occurred"
    };
  }
}