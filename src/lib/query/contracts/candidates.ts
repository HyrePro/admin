import { ListFilters } from "@/lib/query/contracts/list-filters";

export type CandidateApplication = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  score: number;
  demo_score: number;
  application_status: string;
  job_title: string;
  created_at: string;
  job_id: string;
  application_id: string;
};

export type CandidatesListRequest = ListFilters;

export type CandidatesListResponse = {
  applications: CandidateApplication[];
  totalCount: number;
  message?: string;
};

