"use client";

import { useMemo, useState } from "react";
import { QueryKey } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSWRRefresh } from "@/hooks/use-swr-refresh";

type SWRRefreshPollingControlsProps = {
  refreshId: string;
  queryKeys: readonly QueryKey[];
  defaultPollingEnabled?: boolean;
  defaultIntervalMs?: number;
  intervalOptionsMs?: readonly number[];
};

const DEFAULT_INTERVALS = [15_000, 30_000, 60_000] as const;

export default function SWRRefreshPollingControls({
  refreshId,
  queryKeys,
  defaultPollingEnabled = false,
  defaultIntervalMs = 30_000,
  intervalOptionsMs = DEFAULT_INTERVALS,
}: SWRRefreshPollingControlsProps) {
  const [pollingEnabled, setPollingEnabled] = useState(defaultPollingEnabled);
  const [pollingIntervalMs, setPollingIntervalMs] = useState(defaultIntervalMs);

  const { triggerRefresh, isRefreshing } = useSWRRefresh({
    id: refreshId,
    queryKeys,
    pollingEnabled,
    pollingIntervalMs,
  });

  const pollingLabel = useMemo(() => {
    return intervalMsToLabel(pollingIntervalMs);
  }, [pollingIntervalMs]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" disabled={isRefreshing} onClick={() => void triggerRefresh()}>
        <RefreshCcw className="mr-1 h-3.5 w-3.5" />
        {isRefreshing ? "Refreshing..." : "Refresh data"}
      </Button>

      <div className="flex items-center gap-2 rounded-md border px-2 py-1.5">
        <Checkbox
          id={`${refreshId}-polling-enabled`}
          checked={pollingEnabled}
          onCheckedChange={(checked) => setPollingEnabled(Boolean(checked))}
        />
        <Label htmlFor={`${refreshId}-polling-enabled`} className="text-xs font-medium">
          Auto-refresh
        </Label>
      </div>

      <Select
        value={String(pollingIntervalMs)}
        onValueChange={(value) => setPollingIntervalMs(Number.parseInt(value, 10))}
      >
        <SelectTrigger className="h-8 min-w-32">
          <SelectValue placeholder={pollingLabel} />
        </SelectTrigger>
        <SelectContent>
          {intervalOptionsMs.map((intervalMs) => (
            <SelectItem key={intervalMs} value={String(intervalMs)}>
              Every {intervalMsToLabel(intervalMs)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function intervalMsToLabel(intervalMs: number): string {
  if (intervalMs >= 60_000) {
    const minutes = Math.round(intervalMs / 60_000);
    return `${minutes}m`;
  }

  const seconds = Math.round(intervalMs / 1000);
  return `${seconds}s`;
}
