import { queryOptions } from "@tanstack/react-query";
import {
  CandidatesListRequest,
  CandidatesListResponse,
} from "@/lib/query/contracts/candidates";
import { queryKeys } from "@/lib/query/query-keys";
import { FetchContext, fetchJson } from "@/lib/query/fetchers/shared";

function toCandidatesSearchParams(request: CandidatesListRequest): URLSearchParams {
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

export async function fetchCandidatesList(
  request: CandidatesListRequest,
  context?: FetchContext,
): Promise<CandidatesListResponse> {
  return fetchJson<CandidatesListResponse>(
    `/api/applications-sorted?${toCandidatesSearchParams(request).toString()}`,
    context,
  );
}

export function candidatesListQueryOptions(
  request: CandidatesListRequest,
  context?: FetchContext,
) {
  return queryOptions({
    queryKey: queryKeys.candidates.list(request),
    queryFn: () => fetchCandidatesList(request, context),
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnMount: false,
  });
}
