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
}

export function TotalAnalytics({ funnelData }: TotalAnalyticsProps) {
  if (!funnelData) {
    return (
      <div className="border-b border-l border-r rounded-b-lg rounded-t-none p-4">
        <p className="text-center text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="border-b border-l border-r rounded-b-lg rounded-t-none ">
      {/* First Row: Funnel and Gender */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border-b px-4">
        <FunnelStageStackedBar stages={funnelData.stages} />
        <GenderDonutChart demographics={funnelData.demographics} />
      </div>
      
      {/* Second Row: Age and City */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <AgeDistributionChart demographics={funnelData.demographics} />
        <CityDistributionChart demographics={funnelData.demographics} />
      </div>
    </div>
  );
}