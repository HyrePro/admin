import React from "react";

type MetricRow = {
  label: string;
  value: string | number;
  status?: "good" | "warn" | "bad";
};

type MetricCardProps = {
  title: string;
  rows: MetricRow[];
};

const statusColor = {
  good: "bg-green-500",
  warn: "bg-yellow-500",
  bad: "bg-red-500",
};

function MetricCard({ title, rows }: MetricCardProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border bg-white p-4">
      <div className="mb-3 text-sm font-medium text-gray-500">
        {title}
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2 text-gray-600">
              {row.status && (
                <span
                  className={`h-2 w-2 rounded-full ${statusColor[row.status]}`}
                />
              )}
              <span>{row.label}</span>
            </div>

            <div className="font-semibold text-gray-900">
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardMetricsBar() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {/* 1. Jobs Overview */}
      <MetricCard
        title="Jobs Overview"
        rows={[
          { label: "Active", value: 12, status: "good" },
          { label: "Closing Soon", value: 2, status: "warn" },
          { label: "Stalled", value: 3, status: "bad" },
        ]}
      />

      {/* 2. Funnel Snapshot */}
      <MetricCard
        title="Funnel Snapshot"
        rows={[
          { label: "Applied", value: 240 },
          { label: "Shortlisted", value: 64 },
          { label: "Interviewed", value: 18 },
        ]}
      />

      {/* 3. Velocity & Risk */}
      <MetricCard
        title="Velocity & Risk"
        rows={[
          { label: "Avg Time-to-Hire", value: "18 days" },
          { label: "SLA Breaches", value: 2, status: "warn" },
        ]}
      />

      {/* 4. Capacity Load */}
      <MetricCard
        title="Capacity Load"
        rows={[
          { label: "Interviews This Week", value: 14 },
          { label: "Capacity Used", value: "78%", status: "warn" },
        ]}
      />
    </div>
  );
}
