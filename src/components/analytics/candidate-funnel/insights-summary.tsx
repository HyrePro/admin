import { AlertTriangle, BriefcaseBusiness, LaptopMinimal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrowserIssueRow, CandidateFunnelKpis, JobLevelRow } from "@/types/candidate-funnel-analytics";
import { issueToPlainLabel } from "@/components/analytics/candidate-funnel/event-labels";

type InsightsSummaryProps = {
  kpis: CandidateFunnelKpis;
  jobRows: JobLevelRow[];
  browserIssueRows: BrowserIssueRow[];
};

export default function InsightsSummary({ kpis, jobRows, browserIssueRows }: InsightsSummaryProps) {
  const topJob = [...jobRows].sort((a, b) => b.dropoffPct - a.dropoffPct || b.dropped - a.dropped)[0];
  const topTechIssue = [...browserIssueRows].sort((a, b) => b.issueEvents - a.issueEvents)[0];

  return (
    <section className="grid grid-cols-1 gap-3 xl:grid-cols-3">
      <Card className="py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Main Drop Point
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 px-4 pt-2 text-sm">
          <p>
            <span className="font-semibold">{kpis.dropped.toLocaleString()}</span> candidates dropped before the
            MCQ assessment step.
          </p>
          <p className="text-muted-foreground">
            That is <span className="font-medium">{kpis.dropoffPct.toFixed(1)}%</span> of all submitted applications.
          </p>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BriefcaseBusiness className="h-4 w-4 text-sky-600" />
            Most Affected Job
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 px-4 pt-2 text-sm">
          {topJob ? (
            <>
              <p className="font-medium">{topJob.jobTitle}</p>
              <p className="text-muted-foreground">
                {topJob.dropped.toLocaleString()} dropped before MCQ ({topJob.dropoffPct.toFixed(1)}% drop-off).
              </p>
              <p className="text-muted-foreground">Main blocker: {issueToPlainLabel(topJob.topIssueType)}</p>
            </>
          ) : (
            <p className="text-muted-foreground">No job-level drop-off found for this range.</p>
          )}
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <LaptopMinimal className="h-4 w-4 text-violet-600" />
            Most Problematic Tech Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 px-4 pt-2 text-sm">
          {topTechIssue ? (
            <>
              <p className="font-medium">
                {topTechIssue.browserName} {topTechIssue.browserVersion} on {topTechIssue.deviceType}
              </p>
              <p className="text-muted-foreground">
                {topTechIssue.issueEvents.toLocaleString()} total problem events in this range.
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">No browser/device issue spikes found for this range.</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
