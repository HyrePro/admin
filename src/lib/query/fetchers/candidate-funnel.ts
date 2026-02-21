import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { FetchContext, fetchJson } from "@/lib/query/fetchers/shared";
import {
  CandidateFunnelOverviewRequest,
  CandidateFunnelOverviewResponse,
  CandidateSuggestionResponse,
  CandidateTimelineApiResponse,
  CandidateTimelineRequest,
} from "@/lib/query/contracts/candidate-funnel";
import { CandidateFunnelFilters } from "@/types/candidate-funnel-analytics";

function buildCandidateFunnelParams(filters: CandidateFunnelFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set("startDate", filters.startDate);
  params.set("endDate", filters.endDate);

  if (filters.jobId) params.set("jobId", filters.jobId);
  if (filters.candidateSearch) params.set("candidateSearch", filters.candidateSearch);
  if (filters.browser) params.set("browser", filters.browser);
  if (filters.deviceType) params.set("deviceType", filters.deviceType);

  return params;
}

export async function fetchCandidateFunnelOverview(
  filters: CandidateFunnelOverviewRequest,
  context?: FetchContext,
): Promise<CandidateFunnelOverviewResponse> {
  const params = buildCandidateFunnelParams(filters);
  return fetchJson<CandidateFunnelOverviewResponse>(
    `/api/analytics/candidate-funnel?${params.toString()}`,
    context,
  );
}

export async function fetchCandidateSuggestions(
  filters: CandidateFunnelFilters,
  searchText: string,
  context?: FetchContext,
): Promise<CandidateSuggestionResponse> {
  const params = buildCandidateFunnelParams({
    ...filters,
    candidateSearch: searchText,
  });
  params.set("mode", "candidates");

  return fetchJson<CandidateSuggestionResponse>(
    `/api/analytics/candidate-funnel?${params.toString()}`,
    context,
  );
}

export async function fetchCandidateTimeline(
  request: CandidateTimelineRequest,
  context?: FetchContext,
): Promise<CandidateTimelineApiResponse> {
  const params = buildCandidateFunnelParams(request);
  params.set("candidateKey", request.candidateKey);
  params.set("page", String(request.page));
  params.set("pageSize", String(request.pageSize));

  return fetchJson<CandidateTimelineApiResponse>(
    `/api/analytics/candidate-funnel/timeline?${params.toString()}`,
    context,
  );
}

export function candidateFunnelOverviewQueryOptions(
  filters: CandidateFunnelOverviewRequest,
  context?: FetchContext,
) {
  return queryOptions({
    queryKey: queryKeys.candidateFunnel.overview(filters),
    queryFn: () => fetchCandidateFunnelOverview(filters, context),
    staleTime: 60_000,
    gcTime: 15 * 60_000,
    refetchOnMount: false,
  });
}

export function candidateSuggestionsQueryOptions(
  filters: CandidateFunnelFilters,
  searchText: string,
  context?: FetchContext,
) {
  return queryOptions({
    queryKey: queryKeys.candidateFunnel.candidates(filters, searchText),
    queryFn: () => fetchCandidateSuggestions(filters, searchText, context),
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnMount: false,
  });
}

export function candidateTimelineQueryOptions(
  request: CandidateTimelineRequest,
  context?: FetchContext,
) {
  return queryOptions({
    queryKey: queryKeys.candidateFunnel.timeline(
      request,
      request.candidateKey,
      request.page,
      request.pageSize,
    ),
    queryFn: () => fetchCandidateTimeline(request, context),
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnMount: false,
  });
}

export type { FetchContext };
