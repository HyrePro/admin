import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

function createQueryClientConfig() {
  return {
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        gcTime: 15 * 60_000,
        refetchOnMount: false,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 2,
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      },
    },
  };
}

export function makeQueryClient(): QueryClient {
  return new QueryClient(createQueryClientConfig());
}

export const getRequestScopedQueryClient = cache(makeQueryClient);

let browserQueryClient: QueryClient | undefined;

export function getBrowserQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
}
