import { queryOptions } from "@tanstack/react-query";
import { JobsListRequest, JobsListResponse } from "@/lib/query/contracts/jobs";
import { queryKeys } from "@/lib/query/query-keys";
import { FetchContext, fetchJson } from "@/lib/query/fetchers/shared";

function toJobsSearchParams(request: JobsListRequest): URLSearchParams {
  const params = new URLSearchParams();
  const startIndex = request.currentPage * request.pageSize;
  const endIndex = startIndex + request.pageSize;

  params.set("status", request.statusFilter);
  params.set("search", request.searchQuery);
  params.set("startIndex", String(startIndex));
  params.set("endIndex", String(endIndex));
  params.set("sort", request.sortColumn);
  params.set("asc", String(request.sortDirection === "asc"));

  return params;
}

export async function fetchJobsList(
  request: JobsListRequest,
  context?: FetchContext,
): Promise<JobsListResponse> {
  return fetchJson<JobsListResponse>(`/api/jobs?${toJobsSearchParams(request).toString()}`, context);
}

export function jobsListQueryOptions(request: JobsListRequest, context?: FetchContext) {
  return queryOptions({
    queryKey: queryKeys.jobs.list(request),
    queryFn: () => fetchJobsList(request, context),
    staleTime: 60_000,
    gcTime: 15 * 60_000,
    refetchOnMount: false,
  });
}

