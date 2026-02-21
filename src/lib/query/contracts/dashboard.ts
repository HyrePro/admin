export type DashboardStats = {
  total_applications: number;
  interview_ready: number;
  offered: number;
};

export type WeeklyActivityPoint = {
  period: string;
  total_applications: number;
};

export type HiringProgressData = {
  candidates_screened: number;
  shortlisted_for_interview: number;
  interviews_completed: number;
  offers_extended: number;
};

export type SchoolJobApplicant = {
  firstName: string;
  lastName: string;
  avatar: string | null;
};

export type SchoolJob = {
  id: string;
  title: string;
  description: string;
  plan: string;
  max_applications: number;
  recent_applicants: SchoolJobApplicant[];
  candidates_evaluated: number;
  demo_completed: number;
  interview_ready: number;
  offered: number;
  created_at: string;
};

