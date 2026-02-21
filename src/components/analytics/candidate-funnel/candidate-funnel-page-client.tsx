"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import FilterBar from "@/components/analytics/candidate-funnel/filter-bar";
import KpiRow from "@/components/analytics/candidate-funnel/kpi-row";
import FunnelBlock from "@/components/analytics/candidate-funnel/funnel-block";
import JobLevelTable from "@/components/analytics/candidate-funnel/job-level-table";
import BrowserIssuesTable from "@/components/analytics/candidate-funnel/browser-issues-table";
import ScreenTimeTable from "@/components/analytics/candidate-funnel/screen-time-table";
import CandidateIssuesTable from "@/components/analytics/candidate-funnel/candidate-issues-table";
import TimelineDrawer from "@/components/analytics/candidate-funnel/timeline-drawer";
import InsightsSummary from "@/components/analytics/candidate-funnel/insights-summary";
import SWRRefreshPollingControls from "@/components/data/swr-refresh-polling-controls";
import {
  CandidateFunnelFilters,
  CandidateFunnelOverview,
} from "@/types/candidate-funnel-analytics";
import {
  candidateFunnelOverviewQueryOptions,
  candidateSuggestionsQueryOptions,
} from "@/lib/query/fetchers/candidate-funnel";
import { queryKeys } from "@/lib/query/query-keys";

type CandidateFunnelPageClientProps = {
  initialFilters: CandidateFunnelFilters;
};

const EMPTY_OVERVIEW: CandidateFunnelOverview = {
  filters: {
    jobs: [],
    browsers: [],
    deviceTypes: [],
  },
  kpis: {
    submitted: 0,
    proceeded: 0,
    dropped: 0,
    dropoffPct: 0,
    redirectFailures: 0,
    routeGuardBlocks: 0,
  },
  funnel: [
    { label: "Form Submit Success", count: 0, conversionPct: 100 },
    { label: "Next Step Reached", count: 0, conversionPct: 0 },
    { label: "Dropped", count: 0, conversionPct: 0 },
  ],
  jobRows: [],
  browserIssueRows: [],
  screenTimeRows: [],
  candidateRows: [],
  scope: {
    schoolId: null,
    canViewAll: false,
  },
};

export default function CandidateFunnelPageClient({
  initialFilters,
}: CandidateFunnelPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [draftFilters, setDraftFilters] = useState<CandidateFunnelFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<CandidateFunnelFilters>(initialFilters);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedCandidateKey, setSelectedCandidateKey] = useState<string | null>(null);
  const [selectedCandidateLabel, setSelectedCandidateLabel] = useState("");

  const debouncedCandidateSearch = useDebouncedValue(draftFilters.candidateSearch || "", 350);

  const overviewQuery = useQuery(candidateFunnelOverviewQueryOptions(appliedFilters));

  const candidateSuggestionQuery = useQuery({
    ...candidateSuggestionsQueryOptions(draftFilters, debouncedCandidateSearch),
    enabled: debouncedCandidateSearch.trim().length >= 2,
  });

  const overview = overviewQuery.data || EMPTY_OVERVIEW;

  const candidateSuggestions = useMemo(() => {
    if (candidateSuggestionQuery.data?.candidates?.length) {
      return candidateSuggestionQuery.data.candidates;
    }

    return overview.candidateRows.slice(0, 20).map((candidate) => ({
      candidateKey: candidate.candidateKey,
      candidateLabel: candidate.candidateLabel,
    }));
  }, [candidateSuggestionQuery.data?.candidates, overview.candidateRows]);

  const isLoading = overviewQuery.isLoading && !overviewQuery.data;

  const handleFilterChange = (key: keyof CandidateFunnelFilters, value: string | undefined) => {
    setDraftFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    router.replace(`${pathname}?${toSearchParams(draftFilters).toString()}`);
  };

  const handleReset = () => {
    const next = getLast7DayFilters();
    setDraftFilters(next);
    setAppliedFilters(next);
    router.replace(`${pathname}?${toSearchParams(next).toString()}`);
  };

  const handleOpenTimeline = (candidateKey: string, candidateLabel: string) => {
    setSelectedCandidateKey(candidateKey);
    setSelectedCandidateLabel(candidateLabel);
    setTimelineOpen(true);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 lg:p-6">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">Candidate Funnel Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Understand where candidates drop before MCQ assessment and what needs follow-up.
            </p>
          </div>
          <SWRRefreshPollingControls
            refreshId="candidate-funnel"
            queryKeys={[queryKeys.candidateFunnel.all]}
            defaultPollingEnabled={false}
            defaultIntervalMs={30_000}
          />
        </div>
      </header>

      <FilterBar
        draftFilters={draftFilters}
        jobs={overview.filters.jobs}
        browsers={overview.filters.browsers}
        deviceTypes={overview.filters.deviceTypes}
        candidateSuggestions={candidateSuggestions}
        isApplying={overviewQuery.isFetching}
        onFilterChange={handleFilterChange}
        onApply={handleApply}
        onReset={handleReset}
      />

      {overviewQuery.isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Unable to load candidate funnel analytics. Please refresh and try again.
        </div>
      )}

      {!overviewQuery.isLoading &&
        !overviewQuery.isError &&
        overview.kpis.submitted === 0 &&
        overview.jobRows.length === 0 && (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            No candidate funnel data found for the selected filters.
          </div>
        )}

      <KpiRow kpis={overview.kpis} loading={isLoading} />
      <InsightsSummary
        kpis={overview.kpis}
        jobRows={overview.jobRows}
        browserIssueRows={overview.browserIssueRows}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <FunnelBlock stages={overview.funnel} />
        </div>
        <div className="xl:col-span-3">
          <CandidateIssuesTable
            rows={overview.candidateRows}
            loading={isLoading}
            onOpenTimeline={handleOpenTimeline}
          />
        </div>
      </div>

      <JobLevelTable rows={overview.jobRows} loading={isLoading} />
      <BrowserIssuesTable rows={overview.browserIssueRows} loading={isLoading} />
      <ScreenTimeTable rows={overview.screenTimeRows} loading={isLoading} />

      <TimelineDrawer
        open={timelineOpen}
        onOpenChange={setTimelineOpen}
        candidateKey={selectedCandidateKey}
        fallbackCandidateLabel={selectedCandidateLabel}
        filters={appliedFilters}
      />
    </div>
  );
}

function toSearchParams(filters: CandidateFunnelFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set("startDate", filters.startDate);
  params.set("endDate", filters.endDate);

  if (filters.jobId) params.set("jobId", filters.jobId);
  if (filters.candidateSearch) params.set("candidateSearch", filters.candidateSearch);
  if (filters.browser) params.set("browser", filters.browser);
  if (filters.deviceType) params.set("deviceType", filters.deviceType);

  return params;
}

function getLast7DayFilters(): CandidateFunnelFilters {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);

  return {
    startDate: endToDateOnly(start),
    endDate: endToDateOnly(end),
  };
}

function endToDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
