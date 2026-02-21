import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { JobCandidates } from "@/components/job-candidates";
import { getRequestScopedQueryClient } from "@/lib/query/query-client";
import { getServerFetchContext } from "@/lib/query/server-fetch-context";
import { jobCandidatesQueryOptions } from "@/lib/query/fetchers/job-candidates";

interface JobCandidatesPageProps {
  params: Promise<{
    jobId: string;
  }>;
}

export default async function JobCandidatesPage({ params }: JobCandidatesPageProps) {
  const { jobId } = await params;
  const queryClient = getRequestScopedQueryClient();
  const fetchContext = await getServerFetchContext();

  await queryClient
    .prefetchQuery(
      jobCandidatesQueryOptions({
        jobId,
        search: "",
        currentPage: 0,
        pageSize: 10,
      }, fetchContext),
    )
    .catch(() => undefined);

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="h-full">{jobId ? <JobCandidates job_id={jobId} /> : null}</div>
    </HydrationBoundary>
  );
}
