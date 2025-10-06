import { createClient } from "./client"
import { type SupabaseClient } from '@supabase/supabase-js'

export interface JobApplicationScore {
  application_id: string;
  overall: {
    score: number;
    attempted: number;
    total_questions: number;
  };
  category_scores: Record<string, {
    score: number;
    attempted: number;
    total_questions: number;
  }>;
}

interface RawApplicationData {
  id: string;
  overall_score: number;
  total_questions: number;
  attempted_questions: number;
  category_scores: Record<string, {
    score: number;
    attempted: number;
    total_questions: number;
  }>;
}

export async function getJobApplicationScores(jobId: string) {
  // Create the supabase client instance
  const supabase: SupabaseClient = createClient()
  
  try {
    // Get all applications for this job with their scores
    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        overall_score,
        total_questions,
        attempted_questions,
        category_scores
      `)
      .eq("job_id", jobId);

    if (error) {
      throw new Error(error.message || "Failed to fetch application scores");
    }

    // Transform the data to match the expected interface
    const transformedData: JobApplicationScore[] = (data as RawApplicationData[]).map((app) => ({
      application_id: app.id,
      overall: {
        score: app.overall_score || 0,
        attempted: app.attempted_questions || 0,
        total_questions: app.total_questions || 0
      },
      category_scores: app.category_scores || {}
    }));

    return { data: transformedData, error: null };
  } catch (err) {
    console.error("Error fetching job application scores:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}