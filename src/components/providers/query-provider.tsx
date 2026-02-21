"use client";

import { ReactNode } from "react";
import {
  DehydratedState,
  HydrationBoundary,
  QueryClientProvider,
} from "@tanstack/react-query";
import { getBrowserQueryClient } from "@/lib/query/query-client";

type QueryProviderProps = {
  children: ReactNode;
  dehydratedState?: DehydratedState;
};

/**
 * Top-level TanStack Query provider.
 *
 * - QueryClient: source of truth cache for all client queries.
 * - HydrationBoundary: accepts optional server-dehydrated state.
 */
export function QueryProvider({ children, dehydratedState }: QueryProviderProps) {
  const queryClient = getBrowserQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
    </QueryClientProvider>
  );
}
