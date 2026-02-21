"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CandidateFunnelFilters, CandidateTimelineResponse } from "@/types/candidate-funnel-analytics";
import { eventToPlainLabel } from "@/components/analytics/candidate-funnel/event-labels";
import { candidateTimelineQueryOptions } from "@/lib/query/fetchers/candidate-funnel";

type TimelineDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateKey: string | null;
  fallbackCandidateLabel: string;
  filters: CandidateFunnelFilters;
};

const PAGE_SIZE = 20;

export default function TimelineDrawer({
  open,
  onOpenChange,
  candidateKey,
  fallbackCandidateLabel,
  filters,
}: TimelineDrawerProps) {
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (open) {
      setPage(0);
    }
  }, [open, candidateKey]);

  const query = useQuery({
    ...candidateTimelineQueryOptions({
      ...filters,
      candidateKey: candidateKey || "",
      page,
      pageSize: PAGE_SIZE,
    }),
    enabled: open && Boolean(candidateKey),
  });

  const totalPages = useMemo(() => {
    const total = query.data?.total || 0;
    if (total === 0) return 1;
    return Math.ceil(total / PAGE_SIZE);
  }, [query.data?.total]);

  const canGoPrev = page > 0;
  const canGoNext = page + 1 < totalPages;

  const debugSummary = useMemo(() => {
      const events = query.data?.events || [];
      const counts = new Map<string, number>();
      let lastFailure = "none";

    for (const event of events) {
      const plainEventName = eventToPlainLabel(event.eventName);
      counts.set(plainEventName, (counts.get(plainEventName) || 0) + 1);
      if (
        event.eventName === "form_submit_failed" ||
        event.eventName === "redirect_failed" ||
        event.eventName === "route_guard_blocked"
      ) {
        lastFailure = `${eventToPlainLabel(event.eventName)} at ${event.occurredAt}`;
      }
    }

    const summaryLines = [
      `Candidate: ${query.data?.candidateLabel || fallbackCandidateLabel}`,
      `Range: ${filters.startDate} to ${filters.endDate}`,
      `Page: ${page + 1}/${totalPages}`,
      `Events on page: ${events.length}`,
      `Last failure: ${lastFailure}`,
      `Event counts: ${JSON.stringify(Object.fromEntries(counts))}`,
    ];

    return summaryLines.join("\n");
  }, [fallbackCandidateLabel, filters.endDate, filters.startDate, page, query.data, totalPages]);

  const onCopyDebugSummary = async () => {
    try {
      await navigator.clipboard.writeText(debugSummary);
      toast.success("Debug summary copied");
    } catch {
      toast.error("Failed to copy debug summary");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Candidate Timeline</SheetTitle>
          <SheetDescription>
            {query.data?.candidateLabel || fallbackCandidateLabel || "Candidate activity"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center justify-between gap-2 px-4">
          <Badge variant="outline">
            {query.data?.total || 0} events
          </Badge>
          <Button variant="outline" size="sm" onClick={onCopyDebugSummary}>
            <Copy className="mr-1 h-3.5 w-3.5" />
            Copy debug summary
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-240px)] px-4">
          <div className="space-y-3 pb-4">
            {query.isLoading && <p className="text-sm text-muted-foreground">Loading timeline...</p>}
            {query.isError && (
              <p className="text-sm text-destructive">Unable to load timeline for this candidate.</p>
            )}

            {!query.isLoading && !query.isError && (query.data?.events.length || 0) === 0 && (
              <p className="text-sm text-muted-foreground">No timeline events found for this candidate.</p>
            )}

            {query.data?.events.map((event, index) => (
              <article key={`${event.occurredAt}-${event.eventName}-${index}`} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-medium">{eventToPlainLabel(event.eventName)}</p>
                    <p className="text-xs text-muted-foreground">System event: {event.eventName}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDateTime(event.occurredAt)}</p>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-2">
                  <p>Screen: {event.screenName || "-"}</p>
                  <p>Route: {event.routePath || "-"}</p>
                  <p>UI State: {event.uiState || "-"}</p>
                  <p>
                    Browser/Device: {event.browserName} {event.browserVersion} / {event.deviceType}
                  </p>
                </div>

                <details className="mt-2 rounded border bg-muted/20 p-2">
                  <summary className="cursor-pointer text-xs font-medium">Metadata</summary>
                  <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </details>
              </article>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-auto flex items-center justify-between border-t px-4 py-3">
          <Button variant="outline" size="sm" disabled={!canGoPrev || query.isLoading} onClick={() => setPage((v) => v - 1)}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <Button variant="outline" size="sm" disabled={!canGoNext || query.isLoading} onClick={() => setPage((v) => v + 1)}>
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}
