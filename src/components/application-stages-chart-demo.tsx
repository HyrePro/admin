"use client";

import { ApplicationStagesChart } from "./application-stages-chart";

// Sample data for the application stages chart
const sampleData = [
  { stage: "Applications", passed: 120, failed: 30, total: 150 },
  { stage: "Assessment", passed: 85, failed: 35, total: 120 },
  { stage: "Demo", passed: 60, failed: 25, total: 85 },
  { stage: "Interview", passed: 40, failed: 20, total: 60 },
  { stage: "Hired", passed: 25, failed: 15, total: 40 },
];

export function ApplicationStagesChartDemo() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Application Stages Pass/Fail Visualization</h2>
      <ApplicationStagesChart data={sampleData} />
    </div>
  );
}