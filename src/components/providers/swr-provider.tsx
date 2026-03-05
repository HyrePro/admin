"use client";

import { SWRConfig } from "swr";

type SWRProviderProps = {
  children: React.ReactNode;
};

/**
 * SWR is used only for controlled refresh triggers (manual refresh / optional polling).
 * TanStack Query remains the source of truth for page data cache.
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
