import { useEffect } from "react";

export function useWarmRoute(key: string, enabled: boolean, maxAgeSeconds = 60) {
  useEffect(() => {
    if (!enabled) return;
    document.cookie = `${key}=1; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
  }, [key, enabled, maxAgeSeconds]);
}
