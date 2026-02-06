"use client";

import React from "react";
import releaseNotesData from "@/data/release-notes.json";
import { cn } from "@/lib/utils";

type ReleaseItem = {
  version: string;
  date: string;
  type: "ui" | "functional" | "major";
  summary: string;
  changes: string[];
};

const typeStyles: Record<ReleaseItem["type"], { label: string; className: string }> = {
  ui: { label: "UI Update", className: "bg-sky-50 text-sky-700 border-sky-200" },
  functional: { label: "Feature Release", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  major: { label: "Major Release", className: "bg-violet-50 text-violet-700 border-violet-200" },
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ReleaseNotePage() {
  const releases = (releaseNotesData.releases as ReleaseItem[]) ?? [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e7f0ff,transparent_55%),radial-gradient(circle_at_bottom,#f8f0ff,transparent_55%)]">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="mx-auto max-w-6xl px-6 py-16 font-['Space_Grotesk']">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Release Notes
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              What’s new in Hyriki Admin
            </h1>
            <p className="text-base text-slate-600">
              A running log of UI polish and system upgrades, grouped by version.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeStyles).map(([key, value]) => (
              <span
                key={key}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold",
                  value.className
                )}
              >
                {value.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[280px,1fr]">
          <aside className="space-y-4 rounded-2xl border border-white/40 bg-white/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Latest Version
            </h2>
            <div className="space-y-2">
              <p className="text-4xl font-semibold text-slate-900">
                {releases[0]?.version ?? "0.0.0"}
              </p>
              <p className="text-sm text-slate-500">
                {releases[0]?.date ? formatDate(releases[0].date) : "—"}
              </p>
            </div>
          </aside>

          <section className="space-y-8">
            {releases.map((release, index) => {
              const pill = typeStyles[release.type] ?? typeStyles.ui;
              return (
                <div
                  key={`${release.version}-${index}`}
                  className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xl font-semibold text-slate-900">
                          {release.version}
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-semibold",
                            pill.className
                          )}
                        >
                          {pill.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{formatDate(release.date)}</p>
                      <p className="text-base text-slate-700">{release.summary}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {release.changes.map((change, changeIndex) => (
                      <div
                        key={`${release.version}-change-${changeIndex}`}
                        className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                      >
                        <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
                        <span>{change}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
}
