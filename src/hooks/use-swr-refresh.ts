"use client";

import { useCallback, useRef } from "react";
import useSWR from "swr";
import { QueryKey } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type UseSWRRefreshOptions = {
  id: string;
  queryKeys: readonly QueryKey[];
  pollingEnabled?: boolean;
  pollingIntervalMs?: number;
};

/**
 * SWR is used only as a lightweight trigger loop.
 * TanStack Query remains the cache/source of truth.
 */
export function useSWRRefresh({
  id,
  queryKeys: _queryKeys,
  pollingEnabled = false,
  pollingIntervalMs = 0,
}: UseSWRRefreshOptions) {
  const router = useRouter();
  const inFlightRefresh = useRef<Promise<void> | null>(null);

  const runRefresh = useCallback(async () => {
    if (inFlightRefresh.current) {
      return inFlightRefresh.current;
    }

    inFlightRefresh.current = (async () => {
      router.refresh();
      return undefined;
    })().finally(() => {
      inFlightRefresh.current = null;
    });

    return inFlightRefresh.current;
  }, [router]);

  const swr = useSWR(
    pollingEnabled && pollingIntervalMs > 0
      ? ["swr-refresh-loop", id, pollingIntervalMs]
      : null,
    async () => {
      await runRefresh();
      return Date.now();
    },
    {
      refreshInterval: pollingEnabled ? pollingIntervalMs : 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: false,
      revalidateIfStale: false,
      dedupingInterval: pollingIntervalMs,
    },
  );

  return {
    triggerRefresh: runRefresh,
    isRefreshing: swr.isValidating,
  };
}
