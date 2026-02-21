export type InterviewStatusFilter = "all" | "scheduled" | "overdue" | "completed";
export type InterviewCalendarView = "day" | "week" | "month";

export type InterviewStats = {
  interview_ready_applications: number;
  total_interviews: number;
  completed_interviews: number;
  scheduled_interviews: number;
  overdue_interviews: number;
};

export type InterviewScheduleRequest = {
  schoolId: string;
  view: InterviewCalendarView;
  currentDate: string;
  statusFilter: InterviewStatusFilter;
  userId: string;
  jobId?: string | null;
  jobsAssignedToMe: boolean;
  panelist: boolean;
};

export type InterviewParticipant = {
  id: string;
  role: string;
  email: string;
  avatar: string;
  last_name: string;
  first_name: string;
};

export type InterviewCandidate = {
  id: string;
  dob: string | null;
  city: string;
  email: string;
  phone: string;
  state: string;
  avatar: string | null;
  gender: string;
  subjects: unknown[];
  education: unknown[];
  last_name: string;
  first_name: string;
  resume_url: string;
  teaching_experience: unknown[];
};

export type InterviewJob = {
  id: string;
  plan: string;
  title: string;
  status: string;
  openings: number;
  created_by: unknown;
  hired_count: number;
  hiring_urgency: string;
};

export type InterviewScheduleItem = {
  interview_id: string;
  id?: string;
  first_name?: string;
  last_name?: string;
  interview_date: string;
  start_time: string;
  duration_minutes?: number;
  duration?: string;
  status: "scheduled" | "completed" | "overdue";
  interview_type: string;
  meeting_location?: string;
  candidate_response?: "accepted" | "declined" | "pending";
  interviewer_response?: "accepted" | "declined" | "pending";
  meeting_link?: string;
  note: string | null;
  created_at: string;
  candidate: InterviewCandidate;
  job: InterviewJob;
  organiser: InterviewParticipant;
  panelists: InterviewParticipant[];
  candidate_email?: string;
  candidate_phone?: string;
  job_title?: string;
  interviewers?: Array<{
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar?: string;
    role?: string;
    name?: string;
  }>;
  organizer?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar?: string;
    role?: string;
    name?: string;
  };
  notes?: string;
  job_object?: {
    id: string;
    title: string;
    status: string;
    hiring_urgency?: string;
    openings: number;
    hired_count: number;
    created_by?: {
      id?: string;
      first_name?: string;
      last_name?: string;
      avatar?: string;
    };
  };
};

