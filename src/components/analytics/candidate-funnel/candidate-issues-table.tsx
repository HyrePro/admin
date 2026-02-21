"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CandidateIssueRow } from "@/types/candidate-funnel-analytics";
import { issueToPlainLabel } from "@/components/analytics/candidate-funnel/event-labels";

type SortColumn = "candidateLabel" | "failureEvents" | "dropped" | "lastOccurredAt";

type CandidateIssuesTableProps = {
  rows: CandidateIssueRow[];
  loading?: boolean;
  onOpenTimeline: (candidateKey: string, candidateLabel: string) => void;
};

export default function CandidateIssuesTable({
  rows,
  loading = false,
  onOpenTimeline,
}: CandidateIssuesTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("failureEvents");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedRows = useMemo(() => {
    const next = [...rows];
    next.sort((a, b) => {
      const modifier = sortDirection === "asc" ? 1 : -1;

      if (sortColumn === "candidateLabel") {
        return a.candidateLabel.localeCompare(b.candidateLabel) * modifier;
      }

      if (sortColumn === "lastOccurredAt") {
        const aTs = a.lastOccurredAt ? Date.parse(a.lastOccurredAt) : 0;
        const bTs = b.lastOccurredAt ? Date.parse(b.lastOccurredAt) : 0;
        return (aTs - bTs) * modifier;
      }

      return (a[sortColumn] - b[sortColumn]) * modifier;
    });

    return next;
  }, [rows, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }

    setSortColumn(column);
    setSortDirection(column === "candidateLabel" ? "asc" : "desc");
  };

  return (
    <Card className="py-4">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-base">Candidates Who Need Follow-Up</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pt-3">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead
                label="Candidate"
                column="candidateLabel"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHead
                label="Problem Events"
                column="failureEvents"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHead
                label="Dropped Before MCQ"
                column="dropped"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <TableHead>Latest Blocker</TableHead>
              <SortableHead
                label="Last Event"
                column="lastOccurredAt"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <TableHead className="text-right">Timeline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={`candidate-skeleton-${idx}`}>
                  {Array.from({ length: 6 }).map((__, cellIdx) => (
                    <TableCell key={`candidate-skeleton-cell-${cellIdx}`}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && sortedRows.length === 0 && (
              <TableRow>
                <TableCell className="py-6 text-center text-muted-foreground" colSpan={6}>
                  No candidate issue events for this filter.
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              sortedRows.map((row) => (
                <TableRow key={row.candidateKey}>
                  <TableCell className="max-w-72 truncate font-medium">{row.candidateLabel}</TableCell>
                  <TableCell>{row.failureEvents.toLocaleString()}</TableCell>
                  <TableCell>{row.dropped.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{issueToPlainLabel(row.latestIssueType)}</Badge>
                  </TableCell>
                  <TableCell>{row.lastOccurredAt ? formatDateTime(row.lastOccurredAt) : "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenTimeline(row.candidateKey, row.candidateLabel)}
                    >
                      <Clock3 className="mr-1 h-3.5 w-3.5" />
                      Timeline
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

type SortableHeadProps = {
  label: string;
  column: SortColumn;
  activeColumn: SortColumn;
  direction: "asc" | "desc";
  onSort: (column: SortColumn) => void;
};

function SortableHead({ label, column, activeColumn, direction, onSort }: SortableHeadProps) {
  const isActive = activeColumn === column;

  return (
    <TableHead className="cursor-pointer" onClick={() => onSort(column)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          direction === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        )}
      </span>
    </TableHead>
  );
}
