"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const TRICKLE_INTERVAL_MS = 40;
const START_PROGRESS = 8;
const MAX_PROGRESS_DURING_LOAD = 92;
const PROGRESS_CURVE_MS = 1600;
const FAILSAFE_TIMEOUT_MS = 12_000;
const COMPLETE_HIDE_DELAY_MS = 240;
const COMPLETE_SNAP_PROGRESS = 98;

function isModifiedEvent(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function resolveInternalRoute(url: string | URL | null | undefined): string | null {
  if (!url) return null;

  const nextUrl = typeof url === "string" ? new URL(url, window.location.href) : new URL(url.toString(), window.location.href);
  if (nextUrl.origin !== window.location.origin) return null;

  return `${nextUrl.pathname}${nextUrl.search}`;
}

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const currentRouteRef = useRef("");
  const inFlightRef = useRef(false);
  const startTimeRef = useRef(0);
  const trickleTimerRef = useRef<number | null>(null);
  const failsafeTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (trickleTimerRef.current !== null) {
      window.clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = null;
    }
    if (failsafeTimerRef.current !== null) {
      window.clearTimeout(failsafeTimerRef.current);
      failsafeTimerRef.current = null;
    }
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const done = useCallback(() => {
    if (!inFlightRef.current) return;

    clearTimers();
    setProgress((prev) => Math.max(prev, COMPLETE_SNAP_PROGRESS));

    window.requestAnimationFrame(() => {
      setProgress(100);
    });

    hideTimerRef.current = window.setTimeout(() => {
      inFlightRef.current = false;
      setVisible(false);
      setProgress(0);
      hideTimerRef.current = null;
    }, COMPLETE_HIDE_DELAY_MS);
  }, [clearTimers]);

  const start = useCallback(() => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    startTimeRef.current = performance.now();
    setVisible(true);
    setProgress(START_PROGRESS);

    trickleTimerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const eased = 1 - Math.exp(-elapsed / PROGRESS_CURVE_MS);
      const next = START_PROGRESS + (MAX_PROGRESS_DURING_LOAD - START_PROGRESS) * eased;

      setProgress((prev) =>
        Math.min(MAX_PROGRESS_DURING_LOAD, Math.max(prev, next))
      );
    }, TRICKLE_INTERVAL_MS);

    failsafeTimerRef.current = window.setTimeout(() => {
      done();
    }, FAILSAFE_TIMEOUT_MS);
  }, [done]);

  useEffect(() => {
    currentRouteRef.current = `${pathname}${searchParams ? `?${searchParams.toString()}` : ""}`.replace(/\?$/, "");
    done();
  }, [pathname, searchParams, done]);

  useEffect(() => {
    const maybeStartForRoute = (nextRoute: string | null) => {
      if (!nextRoute) return;
      if (nextRoute === currentRouteRef.current) return;
      start();
    };

    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || isModifiedEvent(event)) return;

      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      maybeStartForRoute(`${nextUrl.pathname}${nextUrl.search}`);
    };

    const onPopState = () => {
      maybeStartForRoute(`${window.location.pathname}${window.location.search}`);
    };

    document.addEventListener("click", onClickCapture, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("popstate", onPopState);
      clearTimers();
    };
  }, [clearTimers, start]);

  useEffect(() => {
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    const maybeStartForHistoryUrl = (url: string | URL | null | undefined) => {
      const nextRoute = resolveInternalRoute(url);
      if (!nextRoute) return;
      if (nextRoute === currentRouteRef.current) return;
      start();
    };

    window.history.pushState = ((data: unknown, unused: string, url?: string | URL | null) => {
      maybeStartForHistoryUrl(url);
      return originalPushState(data, unused, url);
    }) as History["pushState"];

    window.history.replaceState = ((data: unknown, unused: string, url?: string | URL | null) => {
      maybeStartForHistoryUrl(url);
      return originalReplaceState(data, unused, url);
    }) as History["replaceState"];

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [start]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed top-0 left-0 z-[100] h-[2px] bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500 transition-[width,opacity] duration-150 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ width: `${progress}%` }}
    />
  );
}
