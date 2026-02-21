import { queryOptions } from "@tanstack/react-query";
import {
  InterviewScheduleItem,
  InterviewScheduleRequest,
  InterviewStats,
} from "@/lib/query/contracts/interviews";
import { queryKeys } from "@/lib/query/query-keys";
import { FetchContext, fetchJson } from "@/lib/query/fetchers/shared";

function toScheduleParams(request: InterviewScheduleRequest): URLSearchParams {
  const params = new URLSearchParams();
  params.set("p_school_id", request.schoolId);
  params.set("p_view", request.view);
  params.set("p_current_date", request.currentDate);
  params.set("p_status_filter", request.statusFilter);
  params.set("p_jobs_assigned_to_me", String(request.jobsAssignedToMe));
  params.set("p_panelist", String(request.panelist));
  params.set("p_user_id", request.userId);
  if (request.jobId) {
    params.set("p_job_id", request.jobId);
  }
  return params;
}

export async function fetchInterviewStats(
  schoolId: string,
  context?: FetchContext,
): Promise<InterviewStats> {
  if (!schoolId) {
    return {
      interview_ready_applications: 0,
      total_interviews: 0,
      completed_interviews: 0,
      scheduled_interviews: 0,
      overdue_interviews: 0,
    };
  }

  return fetchJson<InterviewStats>(
    `/api/interview-stats?p_school_id=${encodeURIComponent(schoolId)}`,
    context,
  );
}

export async function fetchInterviewSchedule(
  request: InterviewScheduleRequest,
  context?: FetchContext,
): Promise<InterviewScheduleItem[]> {
  if (!request.schoolId || !request.userId) {
    return [];
  }

  return fetchJson<InterviewScheduleItem[]>(
    `/api/interview-schedule?${toScheduleParams(request).toString()}`,
    context,
  );
}

export function interviewStatsQueryOptions(schoolId: string, context?: FetchContext) {
  return queryOptions({
    queryKey: queryKeys.interviews.stats(schoolId),
    queryFn: () => fetchInterviewStats(schoolId, context),
    enabled: Boolean(schoolId),
    staleTime: 60_000,
    gcTime: 15 * 60_000,
    refetchOnMount: false,
  });
}

export function interviewScheduleQueryOptions(
  request: InterviewScheduleRequest,
  context?: FetchContext,
) {
  return queryOptions({
    queryKey: queryKeys.interviews.schedule(request),
    queryFn: () => fetchInterviewSchedule(request, context),
    enabled: Boolean(request.schoolId && request.userId),
    staleTime: 60_000,
    gcTime: 15 * 60_000,
    refetchOnMount: false,
  });
}

