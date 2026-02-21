import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import CandidateFunnelPageClient from "@/components/analytics/candidate-funnel/candidate-funnel-page-client";
import { CandidateFunnelFilters } from "@/types/candidate-funnel-analytics";
import { getRequestScopedQueryClient } from "@/lib/query/query-client";
import { candidateFunnelOverviewQueryOptions } from "@/lib/query/fetchers/candidate-funnel";
import { getServerFetchContext } from "@/lib/query/server-fetch-context";

type CandidateFunnelPageProps = {
  searchParams?: {
    startDate?: string;
    endDate?: string;
    jobId?: string;
    candidateSearch?: string;
    browser?: string;
    deviceType?: string;
  };
};

function getDefaultFilters(searchParams?: CandidateFunnelPageProps["searchParams"]): CandidateFunnelFilters {
  const now = new Date();
  const endDate = searchParams?.endDate || now.toISOString().slice(0, 10);

  const startDateValue = new Date(now);
  startDateValue.setDate(startDateValue.getDate() - 6);

  return {
    startDate: searchParams?.startDate || startDateValue.toISOString().slice(0, 10),
    endDate,
    jobId: searchParams?.jobId,
    candidateSearch: searchParams?.candidateSearch,
    browser: searchParams?.browser,
    deviceType: searchParams?.deviceType,
  };
}

export default async function CandidateFunnelPage({ searchParams }: CandidateFunnelPageProps) {
  const initialFilters = getDefaultFilters(searchParams);
  const queryClient = getRequestScopedQueryClient();
  const fetchContext = await getServerFetchContext();

  await queryClient
    .prefetchQuery(candidateFunnelOverviewQueryOptions(initialFilters, fetchContext))
    .catch(() => undefined);

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <CandidateFunnelPageClient initialFilters={initialFilters} />
    </HydrationBoundary>
  );
}
