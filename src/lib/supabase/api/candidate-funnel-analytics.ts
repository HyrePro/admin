import { NextRequest } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { resolveUser } from "@/lib/supabase/api/route-auth";
import {
  AnalyticsScope,
  BrowserIssueRow,
  CandidateFunnelFilters,
  CandidateFunnelKpis,
  CandidateFunnelOverview,
  CandidateFunnelStage,
  CandidateIssueRow,
  CandidateSuggestion,
  CandidateTimelineEvent,
  CandidateTimelineResponse,
  JobLevelRow,
  JobOption,
  ScreenTimeRow,
} from "@/types/candidate-funnel-analytics";

type AnyRow = Record<string, unknown>;

const EVENT_SUBMITTED = "form_submit_success";
const EVENT_PROCEEDED = "next_step_resolved";
const EVENT_REDIRECT_SUCCESS = "redirect_success";
const EVENT_SUBMIT_FAILED = "form_submit_failed";
const EVENT_REDIRECT_FAILED = "redirect_failed";
const EVENT_ROUTE_BLOCKED = "route_guard_blocked";

const ISSUE_EVENTS = new Set([EVENT_SUBMIT_FAILED, EVENT_REDIRECT_FAILED, EVENT_ROUTE_BLOCKED]);

const SUPER_ADMIN_ROLES = new Set(["super_admin", "platform_admin", "internal_admin"]);

const SENSITIVE_METADATA_KEYS = new Set([
  "password",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "session",
  "cookie",
  "resume_url",
  "phone",
  "mobile",
  "aadhaar",
  "ssn",
  "dob",
  "birth_date",
  "address",
]);

export type ScopeResolution =
  | {
      ok: true;
      scope: AnalyticsScope;
      supabase: SupabaseClient;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export function parseCandidateFunnelFilters(
  searchParams: URLSearchParams,
): CandidateFunnelFilters {
  const today = new Date();
  const endDate = searchParams.get("endDate") || toDateOnly(today);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startDate = searchParams.get("startDate") || toDateOnly(sevenDaysAgo);

  return {
    startDate,
    endDate,
    jobId: cleanParam(searchParams.get("jobId")),
    candidateSearch: cleanParam(searchParams.get("candidateSearch")),
    browser: cleanParam(searchParams.get("browser")),
    deviceType: cleanParam(searchParams.get("deviceType")),
  };
}

export async function resolveAnalyticsScope(
  request: NextRequest,
  requestedSchoolId?: string | null,
): Promise<ScopeResolution> {
  const auth = await resolveUser(request);

  if (!auth.userId || !auth.supabaseService) {
    return {
      ok: false,
      status: auth.status,
      error: auth.error || "Unauthorized",
    };
  }

  const { data: adminInfo, error: adminError } = await auth.supabaseService
    .from("admin_user_info")
    .select("school_id, role")
    .eq("id", auth.userId)
    .single();

  if (adminError || !adminInfo) {
    return {
      ok: false,
      status: 403,
      error: "User organization scope could not be resolved",
    };
  }

  const role = asString(adminInfo.role) || null;
  const schoolId = asString(adminInfo.school_id) || null;
  const canViewAll = role ? SUPER_ADMIN_ROLES.has(role.toLowerCase()) : false;

  if (!canViewAll && !schoolId) {
    return {
      ok: false,
      status: 403,
      error: "No school is assigned to the current user",
    };
  }

  if (!canViewAll && requestedSchoolId && requestedSchoolId !== schoolId) {
    return {
      ok: false,
      status: 403,
      error: "School-scoped users cannot query another school",
    };
  }

  const effectiveSchoolId = canViewAll ? requestedSchoolId || null : schoolId;

  return {
    ok: true,
    scope: {
      userId: auth.userId,
      role,
      schoolId,
      canViewAll,
      effectiveSchoolId,
    },
    supabase: auth.supabaseService,
  };
}

export async function getCandidateFunnelOverview(
  supabase: SupabaseClient,
  scope: AnalyticsScope,
  filters: CandidateFunnelFilters,
): Promise<CandidateFunnelOverview> {
  const [events, dropoffDaily, browserIssuesDaily, screenTimeDaily, jobs, rpcKpis] = await Promise.all([
    fetchEnrichedEvents(supabase, scope, filters),
    fetchDailyRows(supabase, "analytics_dropoff_daily", scope, filters, 5000),
    fetchDailyRows(supabase, "analytics_browser_issues_daily", scope, filters, 5000),
    fetchDailyRows(supabase, "analytics_screen_time_daily", scope, filters, 5000),
    fetchJobOptions(supabase, scope),
    fetchOverviewKpisFromRpc(supabase, scope, filters),
  ]);

  const derivedFromEvents = aggregateFromEvents(events);
  const derivedFromDropoff = aggregateFromDropoffDaily(dropoffDaily);
  const derivedFromBrowserDaily = aggregateFromBrowserDaily(browserIssuesDaily);
  const derivedFromScreenDaily = aggregateFromScreenDaily(screenTimeDaily);

  const kpis = chooseKpis(
    rpcKpis || derivedFromDropoff.kpis,
    chooseKpis(derivedFromDropoff.kpis, derivedFromEvents.kpis),
  );
  const funnel: CandidateFunnelStage[] = buildFunnel(kpis);

  const jobRows = applyResolvedJobTitles(
    mergeJobRows(derivedFromDropoff.jobRows, derivedFromEvents.jobRows),
    jobs,
  );
  const browserIssueRows =
    derivedFromBrowserDaily.length > 0
      ? derivedFromBrowserDaily
      : Array.from(derivedFromEvents.browserIssueRows.values());

  const screenTimeRows =
    derivedFromScreenDaily.length > 0
      ? derivedFromScreenDaily
      : Array.from(derivedFromEvents.screenTimeRows.values());

  const candidateRows = Array.from(derivedFromEvents.candidateRows.values())
    .sort((a, b) => b.failureEvents - a.failureEvents || toEpoch(b.lastOccurredAt) - toEpoch(a.lastOccurredAt))
    .slice(0, 100);

  const browserOptions = new Set<string>();
  const deviceTypeOptions = new Set<string>();

  for (const row of browserIssueRows) {
    if (row.browserName) browserOptions.add(row.browserName);
    if (row.deviceType) deviceTypeOptions.add(row.deviceType);
  }

  for (const event of events) {
    const browser = getBrowserName(event);
    const device = getDeviceType(event);
    if (browser) browserOptions.add(browser);
    if (device) deviceTypeOptions.add(device);
  }

  return {
    filters: {
      jobs,
      browsers: Array.from(browserOptions).sort((a, b) => a.localeCompare(b)),
      deviceTypes: Array.from(deviceTypeOptions).sort((a, b) => a.localeCompare(b)),
    },
    kpis,
    funnel,
    jobRows: jobRows
      .sort((a, b) => b.dropoffPct - a.dropoffPct || b.dropped - a.dropped)
      .slice(0, 200),
    browserIssueRows: browserIssueRows
      .sort((a, b) => b.issueEvents - a.issueEvents || b.redirectFailedCount - a.redirectFailedCount)
      .slice(0, 200),
    screenTimeRows: screenTimeRows
      .sort((a, b) => b.totalDurationMs - a.totalDurationMs || b.eventCount - a.eventCount)
      .slice(0, 100),
    candidateRows,
    scope: {
      schoolId: scope.effectiveSchoolId,
      canViewAll: scope.canViewAll,
    },
  };
}

export async function getCandidateSuggestions(
  supabase: SupabaseClient,
  scope: AnalyticsScope,
  filters: CandidateFunnelFilters,
): Promise<CandidateSuggestion[]> {
  const events = await fetchEnrichedEvents(supabase, scope, filters, 1200);
  const suggestions = new Map<string, CandidateSuggestion>();

  const query = (filters.candidateSearch || "").toLowerCase();

  for (const row of events) {
    const candidateKey = getCandidateKey(row);
    if (!candidateKey || suggestions.has(candidateKey)) continue;

    const label = getCandidateLabel(row);
    if (query && !label.toLowerCase().includes(query)) {
      continue;
    }

    suggestions.set(candidateKey, {
      candidateKey,
      candidateLabel: label,
    });
  }

  return Array.from(suggestions.values()).slice(0, 30);
}

export async function getCandidateTimeline(
  supabase: SupabaseClient,
  scope: AnalyticsScope,
  filters: CandidateFunnelFilters,
  candidateKey: string,
  page: number,
  pageSize: number,
): Promise<CandidateTimelineResponse> {
  const rows = await fetchTimelineSourceRows(supabase, scope, filters, 5000);

  const candidateRows = rows
    .filter((row) => getCandidateKey(row) === candidateKey)
    .sort((a, b) => toEpoch(asString(b.occurred_at)) - toEpoch(asString(a.occurred_at)));

  const candidateLabel =
    (candidateRows.length > 0 ? getCandidateLabel(candidateRows[0]) : maskText(candidateKey, 3)) ||
    "Candidate";

  const startIndex = Math.max(page, 0) * Math.max(pageSize, 1);
  const endIndex = startIndex + Math.max(pageSize, 1);

  const events: CandidateTimelineEvent[] = candidateRows
    .slice(startIndex, endIndex)
    .map((row) => ({
      occurredAt: asString(row.occurred_at) || "",
      eventName: getEventName(row),
      screenName: asString(row.screen_name) || "Unknown",
      routePath: asString(row.route_path) || "-",
      uiState: asString(row.ui_state) || "-",
      browserName: getBrowserName(row) || "Unknown",
      browserVersion: getBrowserVersion(row) || "-",
      deviceType: getDeviceType(row) || "Unknown",
      metadata: redactMetadata(extractMetadata(row)),
    }));

  return {
    candidateLabel,
    total: candidateRows.length,
    page: Math.max(page, 0),
    pageSize: Math.max(pageSize, 1),
    events,
  };
}

async function fetchEnrichedEvents(
  supabase: SupabaseClient,
  scope: AnalyticsScope,
  filters: CandidateFunnelFilters,
  limit = 4000,
): Promise<AnyRow[]> {
  const startIso = `${filters.startDate}T00:00:00.000Z`;
  const endIso = `${filters.endDate}T23:59:59.999Z`;

  let query = supabase
    .from("analytics_events_enriched")
    .select("*")
    .gte("occurred_at", startIso)
    .lte("occurred_at", endIso)
    .limit(limit)
    .order("occurred_at", { ascending: false });

  if (scope.effectiveSchoolId) {
    query = query.eq("school_id", scope.effectiveSchoolId);
  }

  if (filters.jobId) {
    query = query.eq("job_id", filters.jobId);
  }

  if (filters.browser) {
    query = query.eq("browser_name", filters.browser);
  }

  if (filters.deviceType) {
    query = query.eq("device_type", filters.deviceType);
  }

  const { data, error } = await query;

  if (error || !Array.isArray(data)) {
    return [];
  }

  const rows = data as AnyRow[];
  const candidateSearch = (filters.candidateSearch || "").trim().toLowerCase();
  const enrichedRows = await enrichRowsWithCandidateIdentity(supabase, rows);

  if (!candidateSearch) {
    return enrichedRows;
  }

  return enrichedRows.filter((row) => matchesCandidateSearch(row, candidateSearch));
}

async function fetchTimelineSourceRows(
  supabase: SupabaseClient,
  scope: AnalyticsScope,
  filters: CandidateFunnelFilters,
  limit: number,
): Promise<AnyRow[]> {
  const startIso = `${filters.startDate}T00:00:00.000Z`;
  const endIso = `${filters.endDate}T23:59:59.999Z`;

  const attempts = ["analytics_events_raw", "analytics_events_enriched"];

  for (const table of attempts) {
    let query = supabase
      .from(table)
      .select("*")
      .gte("occurred_at", startIso)
      .lte("occurred_at", endIso)
      .limit(limit)
      .order("occurred_at", { ascending: false });

    if (scope.effectiveSchoolId) {
      query = query.eq("school_id", scope.effectiveSchoolId);
    }

    if (filters.jobId) {
      query = query.eq("job_id", filters.jobId);
    }

    const { data, error } = await query;

    if (!error && Array.isArray(data)) {
      return await enrichRowsWithCandidateIdentity(supabase, data as AnyRow[]);
    }
  }

  return [];
}

async function fetchDailyRows(
  supabase: SupabaseClient,
  tableName: string,
  scope: AnalyticsScope,
  filters: CandidateFunnelFilters,
  limit: number,
): Promise<AnyRow[]> {
  const dateColumns = ["event_date", "day", "date", "metric_date", "record_date"];

  for (const dateColumn of dateColumns) {
    let query = supabase
      .from(tableName)
      .select("*")
      .gte(dateColumn, filters.startDate)
      .lte(dateColumn, filters.endDate)
      .limit(limit)
      .order(dateColumn, { ascending: false });

    if (scope.effectiveSchoolId) {
      query = query.eq("school_id", scope.effectiveSchoolId);
    }

    const { data, error } = await query;

    if (!error && Array.isArray(data)) {
      const rows = data as AnyRow[];
      return rows.filter((row) => dailyRowMatchesFilters(row, filters));
    }
  }

  return [];
}

async function fetchJobOptions(
  supabase: SupabaseClient,
  scope: AnalyticsScope,
): Promise<JobOption[]> {
  let query = supabase.from("jobs").select("id, title").order("title", { ascending: true }).limit(500);

  if (scope.effectiveSchoolId) {
    query = query.eq("school_id", scope.effectiveSchoolId);
  }

  const { data, error } = await query;

  if (error || !Array.isArray(data)) {
    return [];
  }

  return (data as Array<{ id: string; title: string | null }>)
    .map((job) => ({
      id: job.id,
      title: job.title || "Untitled Job",
    }))
    .filter((job) => Boolean(job.id));
}

async function fetchOverviewKpisFromRpc(
  supabase: SupabaseClient,
  scope: AnalyticsScope,
  filters: CandidateFunnelFilters,
): Promise<CandidateFunnelKpis | null> {
  const payloads: Array<Record<string, unknown>> = [
    {
      p_school_id: scope.effectiveSchoolId,
      p_start_date: filters.startDate,
      p_end_date: filters.endDate,
      p_job_id: filters.jobId || null,
      p_candidate_search: filters.candidateSearch || null,
      p_browser: filters.browser || null,
      p_device_type: filters.deviceType || null,
    },
    {
      input_school_id: scope.effectiveSchoolId,
      start_date: filters.startDate,
      end_date: filters.endDate,
      job_id: filters.jobId || null,
      candidate_search: filters.candidateSearch || null,
      browser: filters.browser || null,
      device_type: filters.deviceType || null,
    },
  ];

  for (const payload of payloads) {
    const { data, error } = await supabase.rpc("get_candidate_analytics_overview", payload);
    if (error || !data) continue;

    const result = Array.isArray(data) ? (data[0] as AnyRow | undefined) : (data as AnyRow);
    if (!result) continue;

    const submitted = getNumber(result, ["submitted", "submitted_count", "total_submitted"]);
    const proceeded = getNumber(result, ["proceeded", "proceeded_count", "total_proceeded"]);
    const dropped = getNumber(result, ["dropped", "dropped_count", "total_dropped"]);
    const redirectFailures = getNumber(result, ["redirect_failures", "redirect_failed_count"]);
    const routeGuardBlocks = getNumber(result, ["route_guard_blocks", "route_block_count"]);

    if (submitted + proceeded + dropped + redirectFailures + routeGuardBlocks === 0) {
      continue;
    }

    return {
      submitted,
      proceeded,
      dropped,
      dropoffPct: pct(dropped, submitted),
      redirectFailures,
      routeGuardBlocks,
    };
  }

  return null;
}

function dailyRowMatchesFilters(row: AnyRow, filters: CandidateFunnelFilters): boolean {
  if (filters.jobId) {
    const jobId = asString(row.job_id) || asString(row.jobId);
    if (jobId && jobId !== filters.jobId) return false;
  }

  if (filters.browser) {
    const browser = asString(row.browser_name) || asString(row.browserName);
    if (browser && browser !== filters.browser) return false;
  }

  if (filters.deviceType) {
    const device = asString(row.device_type) || asString(row.deviceType);
    if (device && device !== filters.deviceType) return false;
  }

  if (filters.candidateSearch) {
    const search = filters.candidateSearch.toLowerCase();
    const candidate = `${getCandidateName(row)} ${getCandidateEmail(row)}`.toLowerCase();
    if (candidate && !candidate.includes(search)) return false;
  }

  return true;
}

function aggregateFromDropoffDaily(rows: AnyRow[]): {
  kpis: CandidateFunnelKpis;
  jobRows: JobLevelRow[];
} {
  const jobMap = new Map<string, JobLevelRow>();

  let submitted = 0;
  let proceeded = 0;
  let dropped = 0;
  let redirectFailures = 0;
  let routeGuardBlocks = 0;

  for (const row of rows) {
    const rowSubmitted = getNumber(row, ["submitted_count", "submitted", "form_submit_success_count"]);
    const rowProceeded = getNumber(row, ["proceeded_count", "proceeded", "next_step_count"]);
    const rowDropped = getNumber(row, ["dropped_count", "dropped"]);
    const rowRedirectFailed = getNumber(row, ["redirect_failed_count", "redirect_failures"]);
    const rowRouteBlocked = getNumber(row, ["route_block_count", "route_guard_block_count"]);

    submitted += rowSubmitted;
    proceeded += rowProceeded;
    dropped += rowDropped;
    redirectFailures += rowRedirectFailed;
    routeGuardBlocks += rowRouteBlocked;

    const jobId = asString(row.job_id) || asString(row.jobId) || "unknown-job";
    const jobTitle = asString(row.job_title) || asString(row.jobTitle) || "Unknown Job";
    const topIssue = asString(row.top_issue_type) || asString(row.issue_type) || "-";

    const existing = jobMap.get(jobId);
    if (existing) {
      existing.submitted += rowSubmitted;
      existing.proceeded += rowProceeded;
      existing.dropped += rowDropped;
      if (existing.topIssueType === "-" && topIssue !== "-") {
        existing.topIssueType = topIssue;
      }
    } else {
      jobMap.set(jobId, {
        jobId,
        jobTitle,
        submitted: rowSubmitted,
        proceeded: rowProceeded,
        dropped: rowDropped,
        dropoffPct: 0,
        topIssueType: topIssue,
      });
    }
  }

  const jobRows = Array.from(jobMap.values()).map((row) => ({
    ...row,
    dropoffPct: pct(row.dropped, row.submitted),
  }));

  const kpis: CandidateFunnelKpis = {
    submitted,
    proceeded,
    dropped,
    dropoffPct: pct(dropped, submitted),
    redirectFailures,
    routeGuardBlocks,
  };

  return { kpis, jobRows };
}

function aggregateFromBrowserDaily(rows: AnyRow[]): BrowserIssueRow[] {
  const map = new Map<string, BrowserIssueRow>();

  for (const row of rows) {
    const browserName = asString(row.browser_name) || asString(row.browserName) || "Unknown";
    const browserVersion = asString(row.browser_version) || asString(row.browserVersion) || "-";
    const deviceType = asString(row.device_type) || asString(row.deviceType) || "Unknown";

    const key = `${browserName}::${browserVersion}::${deviceType}`;

    const issueEvents = getNumber(row, ["issue_events", "issue_event_count", "total_issue_events"]);
    const submitFailedCount = getNumber(row, ["submit_failed_count", "form_submit_failed_count"]);
    const redirectFailedCount = getNumber(row, ["redirect_failed_count"]);
    const routeBlockCount = getNumber(row, ["route_block_count", "route_guard_block_count"]);

    const existing = map.get(key);
    if (existing) {
      existing.issueEvents += issueEvents;
      existing.submitFailedCount += submitFailedCount;
      existing.redirectFailedCount += redirectFailedCount;
      existing.routeBlockCount += routeBlockCount;
    } else {
      map.set(key, {
        browserName,
        browserVersion,
        deviceType,
        issueEvents,
        submitFailedCount,
        redirectFailedCount,
        routeBlockCount,
      });
    }
  }

  return Array.from(map.values());
}

function aggregateFromScreenDaily(rows: AnyRow[]): ScreenTimeRow[] {
  const map = new Map<string, ScreenTimeRow>();

  for (const row of rows) {
    const screenName = asString(row.screen_name) || asString(row.screenName) || "Unknown";
    const totalDurationMs = getNumber(row, ["total_duration_ms", "duration_ms", "total_duration"]);
    const eventCount = getNumber(row, ["event_count", "events"]);

    const existing = map.get(screenName);
    if (existing) {
      existing.totalDurationMs += totalDurationMs;
      existing.eventCount += eventCount;
    } else {
      map.set(screenName, {
        screenName,
        totalDurationMs,
        eventCount,
      });
    }
  }

  return Array.from(map.values());
}

function aggregateFromEvents(events: AnyRow[]): {
  kpis: CandidateFunnelKpis;
  jobRows: JobLevelRow[];
  browserIssueRows: Map<string, BrowserIssueRow>;
  screenTimeRows: Map<string, ScreenTimeRow>;
  candidateRows: Map<string, CandidateIssueRow>;
} {
  let submitted = 0;
  let proceeded = 0;
  let dropped = 0;
  let redirectFailures = 0;
  let routeGuardBlocks = 0;

  const jobMap = new Map<string, JobLevelRow>();
  const issueTypeByJob = new Map<string, Map<string, number>>();
  const browserMap = new Map<string, BrowserIssueRow>();
  const screenMap = new Map<string, ScreenTimeRow>();
  const candidateMap = new Map<string, CandidateIssueRow>();

  for (const event of events) {
    const eventName = getEventName(event);
    const occurredAt = asString(event.occurred_at) || null;

    const jobId = asString(event.job_id) || "unknown-job";
    const jobTitle = asString(event.job_title) || "Unknown Job";

    const jobAgg = getOrCreateJobRow(jobMap, jobId, jobTitle);

    const candidateKey = getCandidateKey(event);
    if (candidateKey) {
      const candidateAgg = getOrCreateCandidateRow(candidateMap, candidateKey, getCandidateLabel(event));
      if (!candidateAgg.lastOccurredAt || toEpoch(occurredAt) > toEpoch(candidateAgg.lastOccurredAt)) {
        candidateAgg.lastOccurredAt = occurredAt;
      }
      if (ISSUE_EVENTS.has(eventName)) {
        candidateAgg.failureEvents += 1;
        candidateAgg.latestIssueType = eventName;
      }
    }

    switch (eventName) {
      case EVENT_SUBMITTED:
        submitted += 1;
        jobAgg.submitted += 1;
        if (candidateKey) {
          const candidateAgg = candidateMap.get(candidateKey);
          if (candidateAgg) candidateAgg.submitted += 1;
        }
        break;
      case EVENT_PROCEEDED:
      case EVENT_REDIRECT_SUCCESS:
        proceeded += 1;
        jobAgg.proceeded += 1;
        if (candidateKey) {
          const candidateAgg = candidateMap.get(candidateKey);
          if (candidateAgg) candidateAgg.proceeded += 1;
        }
        break;
      case EVENT_SUBMIT_FAILED:
      case EVENT_REDIRECT_FAILED:
      case EVENT_ROUTE_BLOCKED:
        dropped += 1;
        jobAgg.dropped += 1;

        if (eventName === EVENT_REDIRECT_FAILED) redirectFailures += 1;
        if (eventName === EVENT_ROUTE_BLOCKED) routeGuardBlocks += 1;

        addIssueType(issueTypeByJob, jobId, eventName);
        addBrowserIssue(browserMap, eventName, event);

        if (candidateKey) {
          const candidateAgg = candidateMap.get(candidateKey);
          if (candidateAgg) {
            candidateAgg.dropped += 1;
          }
        }
        break;
      default:
        break;
    }

    if (eventName === "screen_exit" || eventName === "screen_view") {
      addScreenTime(screenMap, event);
    }
  }

  for (const [jobId, jobAgg] of jobMap.entries()) {
    jobAgg.dropoffPct = pct(jobAgg.dropped, jobAgg.submitted);
    jobAgg.topIssueType = topIssueType(issueTypeByJob.get(jobId));
  }

  const kpis: CandidateFunnelKpis = {
    submitted,
    proceeded,
    dropped,
    dropoffPct: pct(dropped, submitted),
    redirectFailures,
    routeGuardBlocks,
  };

  return {
    kpis,
    jobRows: Array.from(jobMap.values()),
    browserIssueRows: browserMap,
    screenTimeRows: screenMap,
    candidateRows: candidateMap,
  };
}

function mergeJobRows(primary: JobLevelRow[], fallback: JobLevelRow[]): JobLevelRow[] {
  if (primary.length === 0) return fallback;

  const merged = new Map<string, JobLevelRow>();
  for (const row of fallback) {
    merged.set(row.jobId, { ...row });
  }

  for (const row of primary) {
    const existing = merged.get(row.jobId);
    if (!existing) {
      merged.set(row.jobId, { ...row });
      continue;
    }

    const primaryHasData = row.submitted + row.proceeded + row.dropped > 0;
    merged.set(row.jobId, {
      ...existing,
      jobTitle: row.jobTitle || existing.jobTitle,
      submitted: primaryHasData ? row.submitted : existing.submitted,
      proceeded: primaryHasData ? row.proceeded : existing.proceeded,
      dropped: primaryHasData ? row.dropped : existing.dropped,
      dropoffPct: primaryHasData ? row.dropoffPct : existing.dropoffPct,
      topIssueType: row.topIssueType !== "-" ? row.topIssueType : existing.topIssueType,
    });
  }

  return Array.from(merged.values());
}

function chooseKpis(primary: CandidateFunnelKpis, fallback: CandidateFunnelKpis): CandidateFunnelKpis {
  if (primary.submitted + primary.proceeded + primary.dropped > 0) {
    return primary;
  }
  return fallback;
}

function buildFunnel(kpis: CandidateFunnelKpis): CandidateFunnelStage[] {
  return [
    {
      label: "Form Submit Success",
      count: kpis.submitted,
      conversionPct: 100,
    },
    {
      label: "Next Step Reached",
      count: kpis.proceeded,
      conversionPct: pct(kpis.proceeded, kpis.submitted),
    },
    {
      label: "Dropped",
      count: kpis.dropped,
      conversionPct: pct(kpis.dropped, kpis.submitted),
    },
  ];
}

function addIssueType(issueTypeMap: Map<string, Map<string, number>>, jobId: string, issue: string) {
  const jobIssues = issueTypeMap.get(jobId) || new Map<string, number>();
  jobIssues.set(issue, (jobIssues.get(issue) || 0) + 1);
  issueTypeMap.set(jobId, jobIssues);
}

function topIssueType(issues?: Map<string, number>): string {
  if (!issues || issues.size === 0) return "-";

  let top = "-";
  let max = 0;
  for (const [issue, count] of issues.entries()) {
    if (count > max) {
      top = issue;
      max = count;
    }
  }

  return top;
}

function addBrowserIssue(map: Map<string, BrowserIssueRow>, eventName: string, row: AnyRow) {
  const browserName = getBrowserName(row) || "Unknown";
  const browserVersion = getBrowserVersion(row) || "-";
  const deviceType = getDeviceType(row) || "Unknown";
  const key = `${browserName}::${browserVersion}::${deviceType}`;

  const existing = map.get(key) || {
    browserName,
    browserVersion,
    deviceType,
    issueEvents: 0,
    submitFailedCount: 0,
    redirectFailedCount: 0,
    routeBlockCount: 0,
  };

  existing.issueEvents += 1;
  if (eventName === EVENT_SUBMIT_FAILED) existing.submitFailedCount += 1;
  if (eventName === EVENT_REDIRECT_FAILED) existing.redirectFailedCount += 1;
  if (eventName === EVENT_ROUTE_BLOCKED) existing.routeBlockCount += 1;

  map.set(key, existing);
}

function addScreenTime(map: Map<string, ScreenTimeRow>, row: AnyRow) {
  const screenName = asString(row.screen_name) || "Unknown";
  const metadata = extractMetadata(row);
  const durationMs =
    getNumber(row, ["duration_ms", "total_duration_ms"]) || getNumber(metadata, ["duration_ms", "screen_duration_ms"]);

  const existing = map.get(screenName) || {
    screenName,
    totalDurationMs: 0,
    eventCount: 0,
  };

  existing.totalDurationMs += durationMs;
  existing.eventCount += 1;

  map.set(screenName, existing);
}

function getOrCreateJobRow(map: Map<string, JobLevelRow>, jobId: string, jobTitle: string): JobLevelRow {
  const existing = map.get(jobId);
  if (existing) return existing;

  const created: JobLevelRow = {
    jobId,
    jobTitle,
    submitted: 0,
    proceeded: 0,
    dropped: 0,
    dropoffPct: 0,
    topIssueType: "-",
  };

  map.set(jobId, created);
  return created;
}

function getOrCreateCandidateRow(
  map: Map<string, CandidateIssueRow>,
  candidateKey: string,
  candidateLabel: string,
): CandidateIssueRow {
  const existing = map.get(candidateKey);
  if (existing) return existing;

  const created: CandidateIssueRow = {
    candidateKey,
    candidateLabel,
    submitted: 0,
    proceeded: 0,
    dropped: 0,
    failureEvents: 0,
    lastOccurredAt: null,
    latestIssueType: "-",
  };

  map.set(candidateKey, created);
  return created;
}

export function redactMetadata(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_METADATA_KEYS.has(lowerKey) || lowerKey.includes("password") || lowerKey.includes("token")) {
      result[key] = "[REDACTED]";
      continue;
    }

    if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (typeof item === "object" && item !== null) {
          return redactMetadata(item);
        }
        return item;
      });
      continue;
    }

    if (typeof value === "object" && value !== null) {
      result[key] = redactMetadata(value);
      continue;
    }

    result[key] = value;
  }

  return result;
}

export function getCandidateKey(row: AnyRow): string {
  const directId = getCandidateIdentifiers(row)[0] || "";
  if (directId) return `id:${directId}`;

  const email = getCandidateEmail(row);
  if (email) return `email:${email.toLowerCase()}`;

  const name = getCandidateName(row);
  if (name) return `name:${name.toLowerCase()}`;

  return "";
}

export function getCandidateLabel(row: AnyRow): string {
  const name = getCandidateName(row);
  const email = getCandidateEmail(row);

  if (name && email) {
    return `${name} (${maskEmail(email)})`;
  }

  if (name) {
    return name;
  }

  if (email) {
    return maskEmail(email);
  }

  const fallbackId = getCandidateIdentifiers(row)[0] || "";
  if (fallbackId) {
    return `Candidate #${fallbackId.slice(0, 8)}`;
  }

  return "Candidate";
}

function getEventName(row: AnyRow): string {
  return asString(row.event_name) || asString(row.eventName) || "unknown";
}

function getBrowserName(row: AnyRow): string {
  return asString(row.browser_name) || asString(row.browser) || "";
}

function getBrowserVersion(row: AnyRow): string {
  return asString(row.browser_version) || asString(row.browserVersion) || "";
}

function getDeviceType(row: AnyRow): string {
  return asString(row.device_type) || asString(row.device) || "";
}

function extractMetadata(row: AnyRow): AnyRow {
  const metadata = row.metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as AnyRow;
  }
  return {};
}

function getNumber(row: AnyRow, keys: string[]): number {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function pct(part: number, total: number): number {
  if (!total) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

function toDateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}

function toEpoch(value: string | null | undefined): number {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function cleanParam(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function matchesCandidateSearch(row: AnyRow, query: string): boolean {
  const rawName = getCandidateName(row).toLowerCase();
  const rawEmail = getCandidateEmail(row).toLowerCase();
  const displayLabel = getCandidateLabel(row).toLowerCase();
  const candidateKey = getCandidateKey(row).toLowerCase();

  return (
    rawName.includes(query) ||
    rawEmail.includes(query) ||
    displayLabel.includes(query) ||
    candidateKey.includes(query)
  );
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!domain) return maskText(email, 3);

  const first = localPart?.slice(0, 1) || "*";
  return `${first}***@${domain}`;
}

function maskText(value: string, keep = 2): string {
  if (!value) return "";
  if (value.length <= keep) return "*".repeat(value.length);
  return `${value.slice(0, keep)}${"*".repeat(value.length - keep)}`;
}

function getCandidateName(row: AnyRow): string {
  const directCandidates = [
    row.candidate_name,
    row.name,
    row.full_name,
    row.candidate_full_name,
    row.applicant_name,
    row.candidateName,
  ];

  for (const candidate of directCandidates) {
    const value = normalizeHumanName(asString(candidate));
    if (value) return value;
  }

  const composedCandidates: Array<[unknown, unknown]> = [
    [row.first_name, row.last_name],
    [row.candidate_first_name, row.candidate_last_name],
    [row.applicant_first_name, row.applicant_last_name],
    [row.firstName, row.lastName],
  ];

  for (const [first, last] of composedCandidates) {
    const composed = joinNameParts(asString(first), asString(last));
    if (composed) return composed;
  }

  const metadata = extractMetadata(row);
  const nestedName = getNameFromAnyObject(metadata);
  if (nestedName) return nestedName;

  const nestedObjects = [row.candidate, row.applicant, row.user, row.profile];
  for (const obj of nestedObjects) {
    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
      const fromNested = getNameFromAnyObject(obj as AnyRow);
      if (fromNested) return fromNested;
    }
  }

  return "";
}

function getCandidateEmail(row: AnyRow): string {
  const directEmails = [
    row.candidate_email,
    row.email,
    row.applicant_email,
    row.candidateEmail,
  ];

  for (const email of directEmails) {
    const normalized = asString(email).trim();
    if (normalized) return normalized;
  }

  const metadata = extractMetadata(row);
  const metadataEmails = [
    metadata.candidate_email,
    metadata.email,
    metadata.applicant_email,
    metadata.candidateEmail,
  ];

  for (const email of metadataEmails) {
    const normalized = asString(email).trim();
    if (normalized) return normalized;
  }

  const nestedObjects = [row.candidate, row.applicant, row.user, row.profile];
  for (const obj of nestedObjects) {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) continue;
    const record = obj as AnyRow;
    const nested = asString(record.candidate_email || record.email || record.applicant_email).trim();
    if (nested) return nested;
  }

  return "";
}

function getNameFromAnyObject(source: AnyRow): string {
  const direct = normalizeHumanName(
    asString(
      source.candidate_name ||
      source.name ||
      source.full_name ||
      source.candidate_full_name ||
      source.applicant_name,
    ),
  );
  if (direct) return direct;

  const composed = joinNameParts(
    asString(source.first_name || source.candidate_first_name || source.firstName),
    asString(source.last_name || source.candidate_last_name || source.lastName),
  );
  if (composed) return composed;

  return "";
}

function joinNameParts(first: string, last: string): string {
  const cleanFirst = normalizeHumanName(first);
  const cleanLast = normalizeHumanName(last);
  const combined = `${cleanFirst} ${cleanLast}`.trim();
  return normalizeHumanName(combined);
}

function normalizeHumanName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  const invalidNames = new Set([
    "candidate",
    "unknown",
    "n/a",
    "na",
    "null",
    "undefined",
    "-",
  ]);

  if (invalidNames.has(lower)) return "";
  return trimmed;
}

function applyResolvedJobTitles(rows: JobLevelRow[], jobs: JobOption[]): JobLevelRow[] {
  const jobTitlesById = new Map(jobs.map((job) => [job.id, job.title]));

  return rows.map((row) => {
    const resolvedTitle = jobTitlesById.get(row.jobId);
    const currentTitle = row.jobTitle || "";
    const isUnknown = currentTitle.trim().toLowerCase() === "unknown job";

    if (!resolvedTitle) {
      return row;
    }

    if (isUnknown || !currentTitle.trim()) {
      return {
        ...row,
        jobTitle: resolvedTitle,
      };
    }

    return row;
  });
}

async function enrichRowsWithCandidateIdentity(
  supabase: SupabaseClient,
  rows: AnyRow[],
): Promise<AnyRow[]> {
  if (rows.length === 0) return rows;

  const ids = new Set<string>();

  for (const row of rows) {
    const possibleIds = getCandidateIdentifiers(row);

    for (const id of possibleIds) {
      if (looksLikeUuid(id)) {
        ids.add(id);
      }
    }
  }

  if (ids.size === 0) return rows;

  const identityById = new Map<string, { name: string; email: string }>();
  const uuidIds = Array.from(ids);

  await Promise.all([
    hydrateIdentityMap(supabase, identityById, "job_applications", "id", uuidIds),
    hydrateIdentityMap(supabase, identityById, "job_applications", "applicant_id", uuidIds),
    hydrateIdentityMap(supabase, identityById, "applications", "id", uuidIds),
  ]);

  if (identityById.size === 0) return rows;

  return rows.map((row) => {
    const keys = getCandidateIdentifiers(row);

    let identity: { name: string; email: string } | null = null;
    for (const key of keys) {
      const candidateIdentity = identityById.get(key);
      if (candidateIdentity) {
        identity = candidateIdentity;
        break;
      }
    }

    if (!identity) return row;

    const next = { ...row };
    const currentName = getCandidateName(next);
    const currentEmail = getCandidateEmail(next);

    if (!currentName && identity.name) {
      next.candidate_name = identity.name;
    }

    if (!currentEmail && identity.email) {
      next.candidate_email = identity.email;
    }

    return next;
  });
}

async function hydrateIdentityMap(
  supabase: SupabaseClient,
  identityById: Map<string, { name: string; email: string }>,
  table: string,
  idColumn: string,
  ids: string[],
): Promise<void> {
  const chunks = chunk(ids, 200);

  for (const idChunk of chunks) {
    const { data, error } = await (supabase as any)
      .from(table)
      .select(`${idColumn}, first_name, last_name, email`)
      .in(idColumn, idChunk);

    if (error || !Array.isArray(data)) {
      continue;
    }

    for (const row of data as AnyRow[]) {
      const id = asString(row[idColumn]);
      if (!id) continue;

      const name = joinNameParts(asString(row.first_name), asString(row.last_name));
      const email = asString(row.email).trim();

      if (!name && !email) continue;

      const existing = identityById.get(id);
      identityById.set(id, {
        name: existing?.name || name,
        email: existing?.email || email,
      });
    }
  }
}

function chunk<T>(input: T[], size: number): T[][] {
  if (size <= 0) return [input];
  const output: T[][] = [];
  for (let index = 0; index < input.length; index += size) {
    output.push(input.slice(index, index + size));
  }
  return output;
}

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getCandidateIdentifiers(row: AnyRow): string[] {
  const identifiers = new Set<string>();

  const pushIfPresent = (value: unknown) => {
    const normalized = asString(value).trim();
    if (normalized) identifiers.add(normalized);
  };

  pushIfPresent(row.application_id);
  pushIfPresent(row.candidate_id);
  pushIfPresent(row.candidateId);
  pushIfPresent(row.applicant_id);
  pushIfPresent(row.candidate_application_id);
  pushIfPresent(row.applicantId);

  const metadata = extractMetadata(row);
  pushIfPresent(metadata.application_id);
  pushIfPresent(metadata.candidate_id);
  pushIfPresent(metadata.candidateId);
  pushIfPresent(metadata.applicant_id);
  pushIfPresent(metadata.applicantId);

  const nestedObjects = [row.candidate, row.applicant, row.user, row.profile];
  for (const obj of nestedObjects) {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) continue;
    const record = obj as AnyRow;
    pushIfPresent(record.id);
    pushIfPresent(record.application_id);
    pushIfPresent(record.candidate_id);
    pushIfPresent(record.applicant_id);
  }

  return Array.from(identifiers);
}
