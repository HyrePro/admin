import React from "react";

interface JobProgressBarProps {
  stepLabel: string;
  percentLabel: string;
  percent: number;
}

const JobProgressBar: React.FC<JobProgressBarProps> = ({ stepLabel, percentLabel, percent }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-blue-600">{stepLabel}</span>
      <span className="text-sm text-gray-500">{percentLabel}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
        style={{ width: `${percent}%` }}
      ></div>
    </div>
  </div>
);

export default JobProgressBar; 