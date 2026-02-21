export type CandidateFunnelFilters = {
  startDate: string;
  endDate: string;
  jobId?: string;
  candidateSearch?: string;
  browser?: string;
  deviceType?: string;
};

export type AnalyticsScope = {
  userId: string;
  role: string | null;
  schoolId: string | null;
  canViewAll: boolean;
  effectiveSchoolId: string | null;
};

export type JobOption = {
  id: string;
  title: string;
};

export type CandidateSuggestion = {
  candidateKey: string;
  candidateLabel: string;
};

export type CandidateFunnelKpis = {
  submitted: number;
  proceeded: number;
  dropped: number;
  dropoffPct: number;
  redirectFailures: number;
  routeGuardBlocks: number;
};

export type CandidateFunnelStage = {
  label: string;
  count: number;
  conversionPct: number;
};

export type JobLevelRow = {
  jobId: string;
  jobTitle: string;
  submitted: number;
  proceeded: number;
  dropped: number;
  dropoffPct: number;
  topIssueType: string;
};

export type BrowserIssueRow = {
  browserName: string;
  browserVersion: string;
  deviceType: string;
  issueEvents: number;
  submitFailedCount: number;
  redirectFailedCount: number;
  routeBlockCount: number;
};

export type ScreenTimeRow = {
  screenName: string;
  totalDurationMs: number;
  eventCount: number;
};

export type CandidateIssueRow = {
  candidateKey: string;
  candidateLabel: string;
  submitted: number;
  proceeded: number;
  dropped: number;
  failureEvents: number;
  lastOccurredAt: string | null;
  latestIssueType: string;
};

export type CandidateFunnelOverview = {
  filters: {
    jobs: JobOption[];
    browsers: string[];
    deviceTypes: string[];
  };
  kpis: CandidateFunnelKpis;
  funnel: CandidateFunnelStage[];
  jobRows: JobLevelRow[];
  browserIssueRows: BrowserIssueRow[];
  screenTimeRows: ScreenTimeRow[];
  candidateRows: CandidateIssueRow[];
  scope: {
    schoolId: string | null;
    canViewAll: boolean;
  };
};

export type CandidateTimelineEvent = {
  occurredAt: string;
  eventName: string;
  screenName: string;
  routePath: string;
  uiState: string;
  browserName: string;
  browserVersion: string;
  deviceType: string;
  metadata: Record<string, unknown>;
};

export type CandidateTimelineResponse = {
  candidateLabel: string;
  total: number;
  page: number;
  pageSize: number;
  events: CandidateTimelineEvent[];
};
