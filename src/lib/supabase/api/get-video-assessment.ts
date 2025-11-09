import { createClient } from "./client";

// Define the rubrics data structure
export interface RubricsData {
  actionable_feedback?: {
    strengths?: string[];
    areas_for_improvement?: string[];
    red_flags?: string[];
  };
  meta?: {
    notes?: string;
  };
  overall?: {
    overall_score_out_of_10?: number;
    summary?: string;
  };
  scores?: Record<string, number>;
  evidence?: Record<string, string>;
}

export interface VideoAssessmentData {
  id: string;
  created_at: string;
  video_url: string | null;
  transcript: string | null;
  frames: [] | null;
  status: string | null;
  score: number | null;
  rubrics: RubricsData | null;
}

export async function getVideoAssessmentByApplicationId(applicationId: string) {
  // Create the supabase client instance
  const supabase = createClient();
  
  try {
    // Fetch video assessment data by application ID (foreign key reference)
    const { data, error } = await supabase
      .from("application_video_assessment")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (error) {
      throw new Error(error.message || "Failed to fetch video assessment data");
    }

    return { 
      data: data as VideoAssessmentData | null, 
      error: null 
    };
  } catch (err) {
    console.error("Error fetching video assessment data:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}