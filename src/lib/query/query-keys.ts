import {
  CandidateFunnelFilters,
} from "@/types/candidate-funnel-analytics";
import { CandidatesListRequest } from "@/lib/query/contracts/candidates";
import { JobsListRequest } from "@/lib/query/contracts/jobs";
import { InterviewScheduleRequest } from "@/lib/query/contracts/interviews";
import { JobCandidatesRequest } from "@/lib/query/contracts/job-candidates";

function normalizeCandidateFilters(filters: CandidateFunnelFilters) {
  return {
    startDate: filters.startDate,
    endDate: filters.endDate,
    jobId: filters.jobId ?? null,
    candidateSearch: filters.candidateSearch ?? null,
    browser: filters.browser ?? null,
    deviceType: filters.deviceType ?? null,
  } as const;
}

function normalizeJobsFilters(filters: JobsListRequest) {
  return {
    statusFilter: filters.statusFilter,
    searchQuery: filters.searchQuery,
    currentPage: filters.currentPage,
    pageSize: filters.pageSize,
    sortColumn: filters.sortColumn,
    sortDirection: filters.sortDirection,
  } as const;
}

function normalizeCandidatesFilters(filters: CandidatesListRequest) {
  return {
    statusFilter: filters.statusFilter,
    searchQuery: filters.searchQuery,
    currentPage: filters.currentPage,
    pageSize: filters.pageSize,
    sortColumn: filters.sortColumn,
    sortDirection: filters.sortDirection,
  } as const;
}

function normalizeInterviewScheduleRequest(request: InterviewScheduleRequest) {
  return {
    schoolId: request.schoolId,
    view: request.view,
    currentDate: request.currentDate,
    statusFilter: request.statusFilter,
    userId: request.userId,
    jobId: request.jobId ?? null,
    jobsAssignedToMe: request.jobsAssignedToMe,
    panelist: request.panelist,
  } as const;
}

function normalizeJobCandidatesRequest(request: JobCandidatesRequest) {
  return {
    jobId: request.jobId,
    search: request.search,
    currentPage: request.currentPage,
    pageSize: request.pageSize,
  } as const;
}

export const queryKeys = {
  dashboard: {
    all: ["dashboard"] as const,
    schoolJobs: (schoolId: string) => ["dashboard", "school-jobs", { schoolId }] as const,
    hiringProgress: (schoolId: string) =>
      ["dashboard", "hiring-progress", { schoolId }] as const,
    weeklyActivity: (schoolId: string) =>
      ["dashboard", "weekly-activity", { schoolId }] as const,
  },
  jobs: {
    all: ["jobs"] as const,
    list: (filters: JobsListRequest) => ["jobs", "list", normalizeJobsFilters(filters)] as const,
    candidates: (request: JobCandidatesRequest) =>
      ["jobs", "candidates", normalizeJobCandidatesRequest(request)] as const,
  },
  candidates: {
    all: ["candidates"] as const,
    list: (filters: CandidatesListRequest) =>
      ["candidates", "list", normalizeCandidatesFilters(filters)] as const,
  },
  interviews: {
    all: ["interviews"] as const,
    stats: (schoolId: string) => ["interviews", "stats", { schoolId }] as const,
    schedule: (request: InterviewScheduleRequest) =>
      ["interviews", "schedule", normalizeInterviewScheduleRequest(request)] as const,
  },
  candidateFunnel: {
    all: ["candidate-funnel"] as const,
    overview: (filters: CandidateFunnelFilters) =>
      ["candidate-funnel", "overview", normalizeCandidateFilters(filters)] as const,
    candidates: (filters: CandidateFunnelFilters, searchText: string) =>
      [
        "candidate-funnel",
        "candidates",
        normalizeCandidateFilters(filters),
        { searchText },
      ] as const,
    timeline: (
      filters: CandidateFunnelFilters,
      candidateKey: string,
      page: number,
      pageSize: number,
    ) =>
      [
        "candidate-funnel",
        "timeline",
        normalizeCandidateFilters(filters),
        { candidateKey, page, pageSize },
      ] as const,
  },
} as const;

export type CandidateFunnelOverviewQueryKey = ReturnType<
  typeof queryKeys.candidateFunnel.overview
>;

export type CandidateFunnelCandidatesQueryKey = ReturnType<
  typeof queryKeys.candidateFunnel.candidates
>;

export type CandidateFunnelTimelineQueryKey = ReturnType<
  typeof queryKeys.candidateFunnel.timeline
>;
