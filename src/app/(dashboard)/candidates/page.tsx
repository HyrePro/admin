import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import CandidatesPageClient from "@/components/pages/candidates-page-client";
import { getRequestScopedQueryClient } from "@/lib/query/query-client";
import { getServerFetchContext } from "@/lib/query/server-fetch-context";
import { candidatesListQueryOptions } from "@/lib/query/fetchers/candidates";
import { CandidatesListRequest, CandidatesListResponse } from "@/lib/query/contracts/candidates";
import { isWarm } from "@/lib/loading-gate";

interface CandidatesPageProps {
  searchParams?: {
    status?: string;
    search?: string;
    page?: string;
    pageSize?: string;
    sort?: string;
    asc?: string;
  };
}

function toPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export default async function CandidatesPage({ searchParams }: CandidatesPageProps) {
  const initialFilters: CandidatesListRequest = {
    statusFilter: searchParams?.status ?? "ALL",
    searchQuery: searchParams?.search ?? "",
    currentPage: toPositiveInt(searchParams?.page, 0),
    pageSize: toPositiveInt(searchParams?.pageSize, 20),
    sortColumn: searchParams?.sort ?? "created_at",
    sortDirection: searchParams?.asc === "true" ? "asc" : "desc",
  };

  const queryClient = getRequestScopedQueryClient();
  const warm = await isWarm("warm_candidates");
  let initialPayload: CandidatesListResponse | undefined;

  if (!warm) {
    const fetchContext = await getServerFetchContext();
    const initialQuery = candidatesListQueryOptions(initialFilters, fetchContext);
    await queryClient.prefetchQuery(initialQuery).catch(() => undefined);
    initialPayload =
      (queryClient.getQueryData(initialQuery.queryKey) as CandidatesListResponse | undefined) ?? {
        applications: [],
        totalCount: 0,
      };
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <CandidatesPageClient initialFilters={initialFilters} initialPayload={initialPayload} />
    </HydrationBoundary>
  );
}
