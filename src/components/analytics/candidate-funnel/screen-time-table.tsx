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
import { ScreenTimeRow } from "@/types/candidate-funnel-analytics";

type ScreenTimeTableProps = {
  rows: ScreenTimeRow[];
  loading?: boolean;
};

function formatDuration(ms: number): string {
  if (ms <= 0) return "0s";

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function ScreenTimeTable({ rows, loading = false }: ScreenTimeTableProps) {
  const topRows = [...rows].sort((a, b) => b.totalDurationMs - a.totalDurationMs).slice(0, 20);

  return (
    <Card className="py-4">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-base">Screen-Time Insights</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pt-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Screen Name</TableHead>
              <TableHead>Total Duration</TableHead>
              <TableHead>Event Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={`screen-skeleton-${idx}`}>
                  {Array.from({ length: 3 }).map((__, cellIdx) => (
                    <TableCell key={`screen-skeleton-cell-${cellIdx}`}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && topRows.length === 0 && (
              <TableRow>
                <TableCell className="py-6 text-center text-muted-foreground" colSpan={3}>
                  No screen-time data for this filter.
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              topRows.map((row) => (
                <TableRow key={row.screenName}>
                  <TableCell className="font-medium">{row.screenName}</TableCell>
                  <TableCell>{formatDuration(row.totalDurationMs)}</TableCell>
                  <TableCell>{row.eventCount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
