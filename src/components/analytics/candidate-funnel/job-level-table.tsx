"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
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
import { JobLevelRow } from "@/types/candidate-funnel-analytics";
import { issueToPlainLabel } from "@/components/analytics/candidate-funnel/event-labels";

type SortColumn = "jobTitle" | "submitted" | "proceeded" | "dropped" | "dropoffPct" | "topIssueType";

type JobLevelTableProps = {
  rows: JobLevelRow[];
  loading?: boolean;
};

export default function JobLevelTable({ rows, loading = false }: JobLevelTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("dropoffPct");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedRows = useMemo(() => {
    const next = [...rows];
    next.sort((a, b) => {
      const modifier = sortDirection === "asc" ? 1 : -1;

      if (sortColumn === "jobTitle" || sortColumn === "topIssueType") {
        return a[sortColumn].localeCompare(b[sortColumn]) * modifier;
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
    setSortDirection(column === "jobTitle" ? "asc" : "desc");
  };

  return (
    <Card className="py-4">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-base">Jobs with Highest Drop Before MCQ</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pt-3">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead
                label="Job Title"
                column="jobTitle"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHead
                label="Submitted Apps"
                column="submitted"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHead
                label="Reached MCQ"
                column="proceeded"
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
              <SortableHead
                label="Drop-Off Rate"
                column="dropoffPct"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHead
                label="Main Blocker"
                column="topIssueType"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={`job-skeleton-${idx}`}>
                  {Array.from({ length: 6 }).map((__, cellIdx) => (
                    <TableCell key={`job-skeleton-cell-${cellIdx}`}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && sortedRows.length === 0 && (
              <TableRow>
                <TableCell className="py-6 text-center text-muted-foreground" colSpan={6}>
                  No job-level analytics found for this filter.
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              sortedRows.map((row) => (
                <TableRow key={row.jobId}>
                  <TableCell className="max-w-64 truncate font-medium">{row.jobTitle}</TableCell>
                  <TableCell>{row.submitted.toLocaleString()}</TableCell>
                  <TableCell>{row.proceeded.toLocaleString()}</TableCell>
                  <TableCell>{row.dropped.toLocaleString()}</TableCell>
                  <TableCell>{row.dropoffPct.toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {issueToPlainLabel(row.topIssueType)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
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
