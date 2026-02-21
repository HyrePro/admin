"use client";

import { RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CandidateFunnelFilters, CandidateSuggestion, JobOption } from "@/types/candidate-funnel-analytics";

type FilterBarProps = {
  draftFilters: CandidateFunnelFilters;
  jobs: JobOption[];
  browsers: string[];
  deviceTypes: string[];
  candidateSuggestions: CandidateSuggestion[];
  isApplying: boolean;
  onFilterChange: (key: keyof CandidateFunnelFilters, value: string | undefined) => void;
  onApply: () => void;
  onReset: () => void;
  onRefresh?: () => void;
};

const ALL_VALUE = "__all__";

export default function FilterBar({
  draftFilters,
  jobs,
  browsers,
  deviceTypes,
  candidateSuggestions,
  isApplying,
  onFilterChange,
  onApply,
  onReset,
  onRefresh,
}: FilterBarProps) {
  return (
    <section className="rounded-xl border p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Start Date</label>
          <Input
            type="date"
            value={draftFilters.startDate}
            onChange={(event) => onFilterChange("startDate", event.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">End Date</label>
          <Input
            type="date"
            value={draftFilters.endDate}
            onChange={(event) => onFilterChange("endDate", event.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Job</label>
          <Select
            value={draftFilters.jobId || ALL_VALUE}
            onValueChange={(value) => onFilterChange("jobId", value === ALL_VALUE ? undefined : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All jobs</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Candidate Search</label>
          <Input
            list="candidate-funnel-suggestions"
            value={draftFilters.candidateSearch || ""}
            placeholder="Name or email"
            onChange={(event) => onFilterChange("candidateSearch", event.target.value || undefined)}
          />
          <datalist id="candidate-funnel-suggestions">
            {candidateSuggestions.map((candidate) => (
              <option key={candidate.candidateKey} value={candidate.candidateLabel} />
            ))}
          </datalist>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Browser</label>
          <Select
            value={draftFilters.browser || ALL_VALUE}
            onValueChange={(value) => onFilterChange("browser", value === ALL_VALUE ? undefined : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All browsers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All browsers</SelectItem>
              {browsers.map((browser) => (
                <SelectItem key={browser} value={browser}>
                  {browser}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Device Type</label>
          <Select
            value={draftFilters.deviceType || ALL_VALUE}
            onValueChange={(value) => onFilterChange("deviceType", value === ALL_VALUE ? undefined : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All devices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All devices</SelectItem>
              {deviceTypes.map((deviceType) => (
                <SelectItem key={deviceType} value={deviceType}>
                  {deviceType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={onApply} disabled={isApplying}>
          Apply
        </Button>
        <Button variant="outline" onClick={onReset} disabled={isApplying}>
          <RotateCcw className="mr-1 h-4 w-4" />
          Reset
        </Button>
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} disabled={isApplying}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>
    </section>
  );
}
