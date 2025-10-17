import { createClient } from "./client"
import { type SupabaseClient } from '@supabase/supabase-js'

export interface JobApplication {
  application_id: string;
  applicant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  city: string;
  state: string;
  created_at: string;
  status: string;
  resume_url?: string;
  resume_file_name?: string;
  teaching_experience: Array<{
    city: string;
    school: string;
    endDate: string;
    startDate: string;
    designation: string;
  }>;
  education_qualifications: Array<{
    degree: string;
    endDate: string;
    startDate: string;
    institution: string;
    specialization: string;
  }>;
  subjects: string[];
  submitted_at?: string | null;
  score: number;
  category_scores: Record<string, {
    score: number;
    attempted: number;
    total_questions: number;
  }>;
  overall?: {
    score: number;
    attempted: number;
    total_questions: number;
  } | null;
  video_url?: string | null;
  demo_score?: number | null;
}

export async function getJobApplications(
  jobId: string,
  startIndex: number = 0,
  endIndex: number = 10,
  searchText: string = ""
) {
  // Create the supabase client instance
  const supabase: SupabaseClient = createClient()
  
  try {
    // Validate pagination parameters (finite integers, consistent bounds)
    const MAX_INDEX = 10000;
    const MAX_PAGE_SIZE = 100;

    if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex)) {
      throw new Error('Invalid pagination: startIndex and endIndex must be finite numbers');
    }
    const validatedStartIndex = Math.max(0, Math.trunc(startIndex));
    if (validatedStartIndex > MAX_INDEX) {
      throw new Error(`Start index too large. Maximum allowed is ${MAX_INDEX}.`);
    }
    const requestedEndIndex = Math.max(validatedStartIndex + 1, Math.trunc(endIndex));
    if (requestedEndIndex - validatedStartIndex > MAX_PAGE_SIZE) {
      throw new Error(`Maximum page size is ${MAX_PAGE_SIZE} items`);
    }
    const validatedEndIndex = Math.min(requestedEndIndex, MAX_INDEX);
    // Validate jobId format (basic UUID validation)
    if (!jobId || typeof jobId !== 'string' || jobId.length < 36) {
      throw new Error('Invalid job ID format')
    }
    
    // Validate search text length
    if (searchText && searchText.length > 100) {
      throw new Error('Search text too long. Maximum 100 characters allowed.')
    }

    const { data, error } = await supabase.rpc("get_job_applications", {
      p_job_id: 'c235c73c-1d0c-4bd0-a875-6d3bc4ca7c9d',
      p_start_index: validatedStartIndex,
      p_end_index: validatedEndIndex,
      p_search: searchText.trim(),
    });

    if (error) {
      throw new Error(error.message || "Failed to fetch job applications");
    }
    console.log("Job applications fetched successfully:", data);
    return { data: data as JobApplication[], error: null };
  } catch (err) {
    console.error("Error fetching job applications:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}