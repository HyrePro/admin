import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/api/server";
import { resolveSupabaseUser } from "@/lib/supabase/api/session-resolver";
import { DashboardContent } from "@/app/(dashboard)/dashboard-content";
import { getRequestScopedQueryClient } from "@/lib/query/query-client";
import { getServerFetchContext } from "@/lib/query/server-fetch-context";
import {
  hiringProgressQueryOptions,
  schoolJobsQueryOptions,
  weeklyActivityQueryOptions,
} from "@/lib/query/fetchers/dashboard";
import { DashboardStats } from "@/lib/query/contracts/dashboard";

export default async function Page() {
  const supabase = await createClient();
  const { user } = await resolveSupabaseUser(supabase, {
    allowSessionFallback: true,
  });

  if (!user) {
    redirect("/login");
  }

  const { data: adminInfo, error: adminError } = await supabase
    .from("admin_user_info")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (adminError || !adminInfo?.school_id) {
    return <DashboardContent schoolId={null} jobs={[]} dashboardStats={null} error={true} />;
  }

  const schoolId = adminInfo.school_id;
  const queryClient = getRequestScopedQueryClient();
  const fetchContext = await getServerFetchContext();

  const [jobsResult, statsResult] = await Promise.all([
    supabase.from("jobs").select("id").eq("school_id", schoolId),
    supabase.rpc("get_school_dashboard_stats", { p_school_id: schoolId }).single(),
    queryClient.prefetchQuery(schoolJobsQueryOptions(schoolId, fetchContext)).catch(() => undefined),
    queryClient.prefetchQuery(hiringProgressQueryOptions(schoolId, fetchContext)).catch(() => undefined),
    queryClient.prefetchQuery(weeklyActivityQueryOptions(schoolId, fetchContext)).catch(() => undefined),
  ]);

  const jobs = jobsResult.data || [];
  const dashboardStats = (statsResult.data as DashboardStats) || null;
  const error = !!jobsResult.error || !!statsResult.error;
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <DashboardContent
        schoolId={schoolId}
        jobs={jobs}
        dashboardStats={dashboardStats}
        error={error}
      />
    </HydrationBoundary>
  );
}
