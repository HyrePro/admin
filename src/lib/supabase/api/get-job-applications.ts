import { supabase } from "./client";

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
  overall: {
    score: number;
    attempted: number;
    total_questions: number;
  };
  video_url?: string | null;
}

export async function getJobApplications(
  jobId: string,
  startIndex: number = 0,
  endIndex: number = 10,
  searchText: string = ""
) {
  try {
    const { data, error } = await supabase.rpc("get_job_applications", {
      p_job_id: jobId,
      p_start_index: startIndex,
      p_end_index: endIndex,
      p_search: searchText,
    });

    if (error) {
      throw new Error(error.message || "Failed to fetch job applications");
    }

    return { data: data as JobApplication[], error: null };
  } catch (err) {
    console.error("Error fetching job applications:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}