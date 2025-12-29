import { createClient } from '@/lib/supabase/api/client';

// Define the response types based on the expected data structure
export interface SchoolAnalyticsData {
  school_id: string;
  date_range: string;
  generated_at: string;
  job_kpi: JobKPI;
  application_kpi: ApplicationKPI;
  offered_kpi: OfferedKPI;
  hiring_funnel: HiringFunnel;
  demographics: Demographics;
  timeline: TimelineData;
}

export interface JobKPI {
  total_jobs: CountDelta;
  open_jobs: CountDelta;
  completed_with_hire: CountDelta;
  completed_without_hire: CountDelta;
  period: PeriodInfo;
}

export interface ApplicationKPI {
  total_applications: CountDelta;
  eligible_assessment: CountDelta;
  demo_eligible: CountDelta;
  interview_eligible: CountDelta;
  period: PeriodInfo;
}

export interface OfferedKPI {
  offered: CountDelta;
  accepted: CountDelta;
  rejected: CountDelta;
  average_time_to_hire: TimeToHire;
  period: PeriodInfo;
}

export interface HiringFunnel {
  funnel_data: FunnelStage[];
  period: PeriodInfo;
  conversion_rates: ConversionRates;
}

export interface Demographics {
  gender_distribution: GenderData[];
  age_distribution: AgeBucket[];
  city_distribution: Record<string, number>;
  period: PeriodInfo;
}

export interface CountDelta {
  count: number;
  delta: number | null;
  previous_count: number | null;
}

export interface PeriodInfo {
  range: string;
  current_start: string;
  current_end: string;
  previous_start: string | null;
  previous_end: string | null;
}

export interface TimeToHire {
  value: string;
  days: number | null;
  delta: number | null;
  previous_days: number | null;
}

export interface FunnelStage {
  stage: string;
  total?: number;
  passed?: number;
  failed?: number;
  appealed?: number;
  suspended?: number;
  stageTotal?: number;
  completed?: number;
  scheduled?: number;
  hired?: number;
  accepted?: number;
  declined?: number;
}

export interface ConversionRates {
  application_to_assessment: number;
  assessment_to_demo: number;
  demo_to_interview: number;
  interview_to_offer: number;
  offer_to_hire: number;
  overall_conversion: number;
}

export interface GenderData {
  gender: string;
  applications: number;
  fill: string;
}

export interface AgeBucket {
  bucket: string;
  count: number;
}

export interface TimelineData {
  timeline_data: TimelineItem[];
  period_type: string;
  date_range: string;
  summary: TimelineSummary;
  period: PeriodInfo;
}

export interface TimelineItem {
  period: string;
  label: string;
  applications: number;
}

export interface TimelineSummary {
  total_applications: number;
  peak_period: PeakPeriod;
  average_per_period: number;
}

export interface PeakPeriod {
  period: string;
  count: number;
}

// Cache to store analytics data temporarily
const analyticsCache = new Map<string, { data: SchoolAnalyticsData; timestamp: number }>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function getSchoolAnalytics(
  schoolId: string, 
  dateRange: 'day' | 'week' | 'month' | 'all' = 'week'
): Promise<SchoolAnalyticsData> {
  const cacheKey = `${schoolId}-${dateRange}`;
  const now = Date.now();
  
  // Check if we have cached data that's still valid
  const cached = analyticsCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log('Returning cached analytics data');
    return cached.data;
  }
  
  const supabase = createClient();
  
  try {
    // Call the PostgreSQL function
    const { data, error } = await supabase.rpc('get_school_analytics', {
      input_school_id: schoolId,
      date_range: dateRange
    });

    if (error) {
      throw new Error(`Error fetching analytics: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from analytics function');
    }

    // Cache the result
    analyticsCache.set(cacheKey, { data, timestamp: now });
    
    return data;
  } catch (error) {
    // If there's an error, remove any cached data for this key
    analyticsCache.delete(cacheKey);
    throw error;
  }
}

// Function to clear cache for a specific school/dateRange combination
export function clearAnalyticsCache(schoolId: string, dateRange?: 'day' | 'week' | 'month' | 'all') {
  if (dateRange) {
    analyticsCache.delete(`${schoolId}-${dateRange}`);
  } else {
    // Clear all cache entries for this school
    for (const key of analyticsCache.keys()) {
      if (key.startsWith(`${schoolId}-`)) {
        analyticsCache.delete(key);
      }
    }
  }
}