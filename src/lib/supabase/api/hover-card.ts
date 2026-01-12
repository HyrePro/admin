import { createClient } from "./client";

// Types for hover card data
export interface JobHoverInfo {
  id: string;
  title: string;
  status: string;
  created_at: string;
  total_applications: number;
  grade_levels: string[];
  subjects: string[];
  job_type?: string;
  location?: string;
  mode?: string;
  salary_range?: string;
}

export interface CandidateHoverInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  created_at: string;
  status: string;
  score: number | null;
  avatar?: string | null;
}

export interface AdminUserHoverInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  avatar?: string | null;
  created_at: string;
}

export type HoverEntity = "job" | "candidate" | "admin";

export type HoverInfo = JobHoverInfo | CandidateHoverInfo | AdminUserHoverInfo;

// Generic fetcher function
export async function fetchHoverCardData(entity: HoverEntity, entityId: string): Promise<HoverInfo> {
  const supabase = createClient();

  switch (entity) {
    case "job":
      const { data: jobData, error: jobError } = await supabase.rpc("get_job_hover_info", {
        p_job_id: entityId,
      });

      if (jobError) {
        throw new Error(jobError.message || "Failed to fetch job hover data");
      }

      if (!jobData || jobData.length === 0) {
        throw new Error("No job data found");
      }

      return jobData[0] as JobHoverInfo;

    case "candidate":
      const { data: candidateData, error: candidateError } = await supabase.rpc("get_candidate_hover_info", {
        p_candidate_id: entityId,
      });

      if (candidateError) {
        throw new Error(candidateError.message || "Failed to fetch candidate hover data");
      }

      if (!candidateData || candidateData.length === 0) {
        throw new Error("No candidate data found");
      }

      return candidateData[0] as CandidateHoverInfo;

    case "admin":
      const { data: adminData, error: adminError } = await supabase.rpc("get_admin_user_hover_info", {
        p_user_id: entityId,
      });

      if (adminError) {
        throw new Error(adminError.message || "Failed to fetch admin user hover data");
      }

      if (!adminData || adminData.length === 0) {
        throw new Error("No admin user data found");
      }

      return adminData[0] as AdminUserHoverInfo;

    default:
      throw new Error("Invalid entity type for hover card");
  }
}