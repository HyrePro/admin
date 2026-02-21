import { queryOptions } from "@tanstack/react-query";
import {
  JobCandidatesRequest,
  JobCandidatesResponse,
} from "@/lib/query/contracts/job-candidates";
import { queryKeys } from "@/lib/query/query-keys";
import { FetchContext, fetchJson } from "@/lib/query/fetchers/shared";

function toJobCandidatesParams(request: JobCandidatesRequest): URLSearchParams {
  const params = new URLSearchParams();
  const startIndex = request.currentPage * request.pageSize;
  const endIndex = startIndex + request.pageSize;

  params.set("jobId", request.jobId);
  params.set("startIndex", String(startIndex));
  params.set("endIndex", String(endIndex));
  params.set("search", request.search);

  return params;
}

export async function fetchJobCandidates(
  request: JobCandidatesRequest,
  context?: FetchContext,
): Promise<JobCandidatesResponse> {
  if (!request.jobId) {
    return { applications: [], total: 0 };
  }

  return fetchJson<JobCandidatesResponse>(
    `/api/job-applications?${toJobCandidatesParams(request).toString()}`,
    context,
  );
}

export function jobCandidatesQueryOptions(
  request: JobCandidatesRequest,
  context?: FetchContext,
) {
  return queryOptions({
    queryKey: queryKeys.jobs.candidates(request),
    queryFn: () => fetchJobCandidates(request, context),
    enabled: Boolean(request.jobId),
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnMount: false,
  });
}

