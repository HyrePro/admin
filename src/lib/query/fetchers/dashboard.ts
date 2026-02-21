import { queryOptions } from "@tanstack/react-query";
import {
  DashboardStats,
  HiringProgressData,
  SchoolJob,
  WeeklyActivityPoint,
} from "@/lib/query/contracts/dashboard";
import { queryKeys } from "@/lib/query/query-keys";
import { FetchContext, fetchJson } from "@/lib/query/fetchers/shared";

export async function fetchDashboardStats(
  schoolId: string,
  context?: FetchContext,
): Promise<DashboardStats> {
  if (!schoolId) {
    return {
      total_applications: 0,
      interview_ready: 0,
      offered: 0,
    };
  }

  return fetchJson<DashboardStats>(`/api/school-kpis?schoolId=${encodeURIComponent(schoolId)}`, context);
}

export async function fetchSchoolJobs(
  schoolId: string,
  context?: FetchContext,
): Promise<SchoolJob[]> {
  if (!schoolId) return [];
  return fetchJson<SchoolJob[]>(`/api/school-jobs?schoolId=${encodeURIComponent(schoolId)}`, context);
}

export async function fetchHiringProgress(
  schoolId: string,
  context?: FetchContext,
): Promise<HiringProgressData> {
  if (!schoolId) {
    return {
      candidates_screened: 0,
      shortlisted_for_interview: 0,
      interviews_completed: 0,
      offers_extended: 0,
    };
  }

  return fetchJson<HiringProgressData>(
    `/api/hiring-progress?schoolId=${encodeURIComponent(schoolId)}`,
    context,
  );
}

export async function fetchWeeklyActivity(
  schoolId: string,
  context?: FetchContext,
): Promise<WeeklyActivityPoint[]> {
  if (!schoolId) return [];
  return fetchJson<WeeklyActivityPoint[]>(
    `/api/weekly-activity?schoolId=${encodeURIComponent(schoolId)}&type=weekly`,
    context,
  );
}

export function schoolJobsQueryOptions(schoolId: string, context?: FetchContext) {
  return queryOptions({
    queryKey: queryKeys.dashboard.schoolJobs(schoolId),
    queryFn: () => fetchSchoolJobs(schoolId, context),
    enabled: Boolean(schoolId),
    staleTime: 60_000,
    gcTime: 15 * 60_000,
    refetchOnMount: false,
  });
}

export function hiringProgressQueryOptions(schoolId: string, context?: FetchContext) {
  return queryOptions({
    queryKey: queryKeys.dashboard.hiringProgress(schoolId),
    queryFn: () => fetchHiringProgress(schoolId, context),
    enabled: Boolean(schoolId),
    staleTime: 60_000,
    gcTime: 15 * 60_000,
    refetchOnMount: false,
  });
}

export function weeklyActivityQueryOptions(schoolId: string, context?: FetchContext) {
  return queryOptions({
    queryKey: queryKeys.dashboard.weeklyActivity(schoolId),
    queryFn: () => fetchWeeklyActivity(schoolId, context),
    enabled: Boolean(schoolId),
    staleTime: 60_000,
    gcTime: 15 * 60_000,
    refetchOnMount: false,
  });
}

