import { supabase } from "./client";

export interface CategoryScore {
  score: number;
  attempted: number;
  total_questions: number;
}

export interface OverallScore {
  score: number;
  attempted: number;
  total_questions: number;
}

export interface JobApplicationScore {
  application_id: string;
  overall: OverallScore;
  category_scores: Record<string, CategoryScore>;
}

export async function getJobApplicationScores(jobId: string) {
  try {
    const { data, error } = await supabase.rpc("get_job_application_scores", {
      job_id_input: jobId,
    });

    if (error) {
      throw new Error(error.message || "Failed to fetch job application scores");
    }

    return { data: data as JobApplicationScore[], error: null };
  } catch (err) {
    console.error("Error fetching job application scores:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}