export type JobCandidateApplication = {
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
  category_scores: Record<
    string,
    {
      score: number;
      attempted: number;
      total_questions: number;
    }
  >;
  overall?: {
    score: number;
    attempted: number;
    total_questions: number;
  } | null;
  video_url?: string | null;
  demo_score?: number | null;
};

export type JobCandidatesRequest = {
  jobId: string;
  search: string;
  currentPage: number;
  pageSize: number;
};

export type JobCandidatesResponse = {
  applications: JobCandidateApplication[];
  total: number;
  message?: string;
};

