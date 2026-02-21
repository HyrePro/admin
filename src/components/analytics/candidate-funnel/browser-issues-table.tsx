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
import { Skeleton } from "@/components/ui/skeleton";
import { BrowserIssueRow } from "@/types/candidate-funnel-analytics";

type SortColumn =
  | "browserName"
  | "browserVersion"
  | "deviceType"
  | "issueEvents"
  | "submitFailedCount"
  | "redirectFailedCount"
  | "routeBlockCount";

type BrowserIssuesTableProps = {
  rows: BrowserIssueRow[];
  loading?: boolean;
};

export default function BrowserIssuesTable({ rows, loading = false }: BrowserIssuesTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("issueEvents");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedRows = useMemo(() => {
    const next = [...rows];
    next.sort((a, b) => {
      const modifier = sortDirection === "asc" ? 1 : -1;

      if (sortColumn === "browserName" || sortColumn === "browserVersion" || sortColumn === "deviceType") {
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
    setSortDirection(column === "browserName" ? "asc" : "desc");
  };

  return (
    <Card className="py-4">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-base">Browser and Device Combinations Causing Problems</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pt-3">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead
                label="Browser"
                column="browserName"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHead
                label="Version"
                column="browserVersion"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHead
                label="Device"
                column="deviceType"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHead
                label="Total Problem Events"
                column="issueEvents"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHead
                label="Form Submit Errors"
                column="submitFailedCount"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHead
                label="Could Not Continue"
                column="redirectFailedCount"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHead
                label="Access Blocked"
                column="routeBlockCount"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={`browser-skeleton-${idx}`}>
                  {Array.from({ length: 7 }).map((__, cellIdx) => (
                    <TableCell key={`browser-skeleton-cell-${cellIdx}`}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && sortedRows.length === 0 && (
              <TableRow>
                <TableCell className="py-6 text-center text-muted-foreground" colSpan={7}>
                  No browser or device issues for this filter.
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              sortedRows.map((row) => (
                <TableRow key={`${row.browserName}-${row.browserVersion}-${row.deviceType}`}>
                  <TableCell className="font-medium">{row.browserName}</TableCell>
                  <TableCell>{row.browserVersion}</TableCell>
                  <TableCell>{row.deviceType}</TableCell>
                  <TableCell>{row.issueEvents.toLocaleString()}</TableCell>
                  <TableCell>{row.submitFailedCount.toLocaleString()}</TableCell>
                  <TableCell>{row.redirectFailedCount.toLocaleString()}</TableCell>
                  <TableCell>{row.routeBlockCount.toLocaleString()}</TableCell>
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
