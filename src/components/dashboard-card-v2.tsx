// Create dashboard card component
import React from "react";

interface DashboardCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ children, title, className }) => {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export default DashboardCard;