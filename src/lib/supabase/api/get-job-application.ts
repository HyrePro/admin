import { supabase } from "./client";

export interface ApplicationInfo {
  application_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city: string;
  state: string;
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
  grade_levels?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CandidateInfo {
  application_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city: string;
  state: string;
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
  grade_levels?: string[];
}

export interface ApplicationStage {
  application_id: string;
  status: string;
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
  created_at?: string;
  updated_at?: string;
}

export async function getJobApplication(applicationId: string) {
  try {
    const { data, error } = await supabase.rpc("get_job_application", {
      p_application_id: applicationId,
    });

    if (error) {
      throw new Error(error.message || "Failed to fetch job application");
    }

    const applicationData = data?.[0] as ApplicationInfo;
    
    if (!applicationData) {
      throw new Error("Application not found");
    }

    // Split data into candidate info and application stage
    const candidateInfo: CandidateInfo = {
      application_id: applicationData.application_id,
      first_name: applicationData.first_name,
      last_name: applicationData.last_name,
      email: applicationData.email,
      phone: applicationData.phone,
      city: applicationData.city,
      state: applicationData.state,
      resume_url: applicationData.resume_url,
      resume_file_name: applicationData.resume_file_name,
      teaching_experience: applicationData.teaching_experience,
      education_qualifications: applicationData.education_qualifications,
      subjects: applicationData.subjects,
      grade_levels: applicationData.grade_levels,
    };

    const applicationStage: ApplicationStage = {
      application_id: applicationData.application_id,
      status: applicationData.status,
      submitted_at: applicationData.submitted_at,
      score: applicationData.score,
      category_scores: applicationData.category_scores,
      overall: applicationData.overall,
      video_url: applicationData.video_url,
      created_at: applicationData.created_at,
      updated_at: applicationData.updated_at,
    };

    return { 
      candidateInfo, 
      applicationStage, 
      fullData: applicationData,
      error: null 
    };
  } catch (err) {
    console.error("Error fetching job application:", err);
    return {
      candidateInfo: null,
      applicationStage: null,
      fullData: null,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}