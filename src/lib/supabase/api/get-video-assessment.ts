import { createClient } from "./client";
import { type SupabaseClient } from '@supabase/supabase-js';

export interface VideoAssessmentData {
  id: string;
  created_at: string;
  video_url: string | null;
  transcript: string | null;
  frames: any | null;
  status: string | null;
  score: number | null;
  rubrics: any | null;
}

export async function getVideoAssessmentByApplicationId(applicationId: string) {
  // Create the supabase client instance
  const supabase: SupabaseClient = createClient();
  
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