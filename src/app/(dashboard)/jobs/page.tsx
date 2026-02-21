import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import JobsPageClient from "@/components/pages/jobs-page-client";
import { getRequestScopedQueryClient } from "@/lib/query/query-client";
import { getServerFetchContext } from "@/lib/query/server-fetch-context";
import { jobsListQueryOptions } from "@/lib/query/fetchers/jobs";
import { JobsListRequest } from "@/lib/query/contracts/jobs";

interface JobsPageProps {
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

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const initialFilters: JobsListRequest = {
    statusFilter: searchParams?.status ?? "ALL",
    searchQuery: searchParams?.search ?? "",
    currentPage: toPositiveInt(searchParams?.page, 0),
    pageSize: toPositiveInt(searchParams?.pageSize, 20),
    sortColumn: searchParams?.sort ?? "created_at",
    sortDirection: searchParams?.asc === "true" ? "asc" : "desc",
  };

  const queryClient = getRequestScopedQueryClient();
  const fetchContext = await getServerFetchContext();

  await queryClient.prefetchQuery(jobsListQueryOptions(initialFilters, fetchContext)).catch(() => undefined);
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <JobsPageClient initialFilters={initialFilters} />
    </HydrationBoundary>
  );
}
