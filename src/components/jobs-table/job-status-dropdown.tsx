import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface JobStatusDropdownProps {
  status: string;
  statusColors: Record<string, string>;
  onStatusChange: (newStatus: string) => void;
  statusOptions?: { value: string; label: string }[];
  className?: string;
}

const JobStatusDropdown: React.FC<JobStatusDropdownProps> = ({
  status,
  statusColors,
  onStatusChange,
  statusOptions = [
    { value: "OPEN", label: "Open" },
    { value: "PAUSED", label: "Paused" },
    { value: "COMPLETED", label: "Completed" },
  ],
  className = ""
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge
        className={cn(
          "capitalize font-medium",
          statusColors[status] || "bg-gray-50 text-gray-700 border-gray-200"
        )}
      >
        {status.toLowerCase().replace("_", " ")}
      </Badge>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[80px] h-6 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export { JobStatusDropdown };