import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import InterviewsPageClient from "@/components/pages/interviews-page-client";
import { createClient } from "@/lib/supabase/api/server";
import { resolveSupabaseUser } from "@/lib/supabase/api/session-resolver";
import { getRequestScopedQueryClient } from "@/lib/query/query-client";
import { getServerFetchContext } from "@/lib/query/server-fetch-context";
import {
  interviewScheduleQueryOptions,
  interviewStatsQueryOptions,
} from "@/lib/query/fetchers/interviews";
import {
  InterviewCalendarView,
  InterviewStatusFilter,
} from "@/lib/query/contracts/interviews";

interface InterviewsPageProps {
  searchParams?: {
    view?: InterviewCalendarView;
    date?: string;
    status?: InterviewStatusFilter;
    assignedToMe?: string;
    panelist?: string;
  };
}

function getDefaultDate() {
  return new Date().toISOString().split("T")[0];
}

function toInterviewDate(value: string | undefined): string {
  if (!value) return getDefaultDate();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return getDefaultDate();
  return parsed.toISOString().split("T")[0];
}

function toInterviewView(value: string | undefined): InterviewCalendarView {
  if (value === "day" || value === "week" || value === "month") return value;
  return "week";
}

function toInterviewStatus(value: string | undefined): InterviewStatusFilter {
  if (value === "all" || value === "scheduled" || value === "overdue" || value === "completed") {
    return value;
  }
  return "all";
}

export default async function InterviewsPage({ searchParams }: InterviewsPageProps) {
  const supabase = await createClient();
  const { user } = await resolveSupabaseUser(supabase, {
    allowSessionFallback: true,
  });

  if (!user) {
    return <InterviewsPageClient initialFilters={null} />;
  }

  const { data: adminInfo } = await supabase
    .from("admin_user_info")
    .select("school_id")
    .eq("id", user.id)
    .single();

  const schoolId = adminInfo?.school_id ?? null;

  const initialFilters = schoolId
    ? {
        schoolId,
        userId: user.id,
        view: toInterviewView(searchParams?.view),
        currentDate: toInterviewDate(searchParams?.date),
        statusFilter: toInterviewStatus(searchParams?.status),
        jobsAssignedToMe: searchParams?.assignedToMe === "true",
        panelist: searchParams?.panelist === "true",
      }
    : null;

  if (!initialFilters) {
    return <InterviewsPageClient initialFilters={null} />;
  }

  const queryClient = getRequestScopedQueryClient();
  const fetchContext = await getServerFetchContext();

  await Promise.all([
    queryClient
      .prefetchQuery(interviewStatsQueryOptions(initialFilters.schoolId, fetchContext))
      .catch(() => undefined),
    queryClient
      .prefetchQuery(interviewScheduleQueryOptions(initialFilters, fetchContext))
      .catch(() => undefined),
  ]);

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <InterviewsPageClient initialFilters={initialFilters} />
    </HydrationBoundary>
  );
}
