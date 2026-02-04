import * as React from "react";

import {
  ChartConfig,
} from "@/components/ui/chart";
  import type { JobFunnelAnalytics } from "@/lib/supabase/api/get-job-analytics";

import FunnelStageStackedBar, { JobFunnelAnalyticsWithDemographics } from "./funnel-area-chart";
import GenderDonutChart from "./gender-donut-chart";
import AgeDistributionChart from "./age-distibution-chart";
import CityDistributionChart from "./city-distribution-chart";

interface TotalAnalyticsProps {
  funnelData: JobFunnelAnalyticsWithDemographics | null;
  loading?: boolean;
  error?: string | null;
}

export function TotalAnalytics({ funnelData, loading = false, error = null }: TotalAnalyticsProps) {
  if (loading) {
    return (
      <div className="p-6">
        <div className="h-16 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-700">Failed to load total analytics. {error}</p>
      </div>
    );
  }

  if (!funnelData) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">No total analytics available yet.</p>
      </div>
    );
  }

  return (
    <div>
      {/* First Row: Funnel and Gender */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border-b divide-y lg:divide-y-0 lg:divide-x">
        <FunnelStageStackedBar stages={funnelData.stages} />
        <GenderDonutChart demographics={funnelData.demographics} />
      </div>
      
      {/* Second Row: Age and City */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x">
        <AgeDistributionChart demographics={funnelData.demographics} />
        <CityDistributionChart demographics={funnelData.demographics} />
      </div>
    </div>
  );
}
