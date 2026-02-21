'use client'

import React, { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import dynamic from "next/dynamic"
import { BarChartIcon, TrendingUp, TrendingDown, UsersIcon, ClockIcon } from '@/components/icons'
import { SchoolKPIs } from '@/components/analytics/school-kpis'
import SchoolKPIOverview from '@/components/analytics/school-kpi-overview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import '@/styles/analytics.css'

import type { SchoolAnalyticsData } from '@/lib/supabase/api/analyticsService';
import { MetricCard } from '@/components/analytic-dashboard-card'
import HiringFunnelChart from '@/components/school-hiring-funnel'
import GenderDistributionChart from '@/components/school-gender-distribution'
import AgeDistributionChart from '@/components/analytics/school-age-demongraphics'
import CityDistributionChart from '@/components/analytics/school-city-distribution'
import { ApplicationsPerDayChart } from '@/components/analytics/school-applications'

// Dynamically import heavy components to reduce initial bundle size
const HiringProgressChart = dynamic(() => import("@/components/hiring-progress-chart").then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="border rounded-lg p-4">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
      <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
    </div>
  )
})

const WeeklyActivity = dynamic(() => import("@/components/weekly-activity-chart").then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="border rounded-lg p-4">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
      <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
    </div>
  )
})

type AnalyticsPeriod = 'day' | 'week' | 'month' | 'all';

const ANALYTICS_TIMEOUT_MS = 25_000;

const fetchSchoolAnalytics = async (period: AnalyticsPeriod = 'week'): Promise<SchoolAnalyticsData> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), ANALYTICS_TIMEOUT_MS);

  try {
    const response = await fetch(`/api/analytics/school-overview?period=${encodeURIComponent(period)}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        payload && typeof payload === 'object' && 'error' in payload
          ? String((payload as { error?: string }).error || 'Failed to load analytics data')
          : `Request failed (${response.status})`;
      throw new Error(message);
    }

    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid analytics response');
    }

    return payload as SchoolAnalyticsData;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Analytics request timed out. Please try again.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}



export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<AnalyticsPeriod>('week'); // Default to 'This Week'
  const handleDateRangeChange = (value: string) => {
    if (value === "day" || value === "week" || value === "month" || value === "all") {
      setDateRange(value);
    }
  };

  // Fetch school analytics data
  const {
    data: schoolAnalytics,
    error: analyticsError,
    isLoading: analyticsLoading,
    refetch,
  } = useQuery({
    queryKey: ['school-analytics', dateRange],
    queryFn: () => fetchSchoolAnalytics(dateRange),
    placeholderData: (previousData) => previousData,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
  
  const analyticsErrorMessage =
    analyticsError instanceof Error ? analyticsError.message : 'Unknown error';

  // Loading state - Enhanced with KPI loading
  if (analyticsLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex-1 flex-col">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className='btn-invite'>
                Feedback
              </Button>
            </div>
          </div>

          {/* Loading KPI metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mt-2" />
              </div>
            ))}
          </div>

          {/* Loading chart */}
          <div className="space-y-6">
            <div className="h-[400px] bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (analyticsError) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex-1 flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className='btn-invite'>
                Feedback
              </Button>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-red-50">
            <p className="text-red-800">Failed to load analytics data: {analyticsErrorMessage}</p>
            <button
              onClick={() => void refetch()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!schoolAnalytics) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex-1 flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className='btn-invite'>
                Feedback
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center py-16">
            <div className="text-gray-500">No analytics data available for the selected period.</div>
          </div>
        </div>
      </div>
    )
  }

  // Render the actual data
  return (
    <div className='analytics-container flex flex-1 flex-col pb-16 '>
      <div className="flex-1 flex-col">
        <div className="analytics-header">
          <h1 className="analytics-title">Analytics</h1>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>

              </SelectContent>
            </Select>
          </div>
        </div>
        <div className='overflow-y-auto min-h-0 flex-1 max-h-[calc(100vh-18vh)]'>
        <div className="grid gap-6 mt-4 
  grid-cols-1 
  lg:grid-cols-2 
  xl:grid-cols-3">

          <MetricCard title="Total Jobs" value={schoolAnalytics?.job_kpi?.total_jobs?.count || 0} delta={schoolAnalytics?.job_kpi?.total_jobs?.delta || 0}
            description='Total jobs is the number of job postings created.'
            items={[
              {
                key: '1',
                label: 'Open Jobs',
                value: schoolAnalytics?.job_kpi?.open_jobs?.count || 0,
                delta: schoolAnalytics?.job_kpi?.open_jobs?.delta || 0,
                description: 'Open jobs are currently active job postings.'
              },
              {
                key: '2',
                label: 'Completed with Hire',
                value: schoolAnalytics?.job_kpi?.completed_with_hire?.count || 0,
                delta: schoolAnalytics?.job_kpi?.completed_with_hire?.delta || 0,
                description: 'Jobs that were completed with a successful hire.'
              },
              {
                key: '3',
                label: 'Completed without Hire',
                value: schoolAnalytics?.job_kpi?.completed_without_hire?.count || 0,
                delta: schoolAnalytics?.job_kpi?.completed_without_hire?.delta || 0,
                description: 'Jobs that were closed without a hire.'
              }
            ]} />

          <MetricCard title="Total Applications" value={schoolAnalytics?.application_kpi?.total_applications?.count || 0} delta={schoolAnalytics?.application_kpi?.total_applications?.delta || 0}
            description='Applications received within the selected time range.'
            items={[
              {
                key: '1',
                label: 'Eligible Assessment',
                value: schoolAnalytics?.application_kpi?.eligible_assessment?.count || 0,
                delta: schoolAnalytics?.application_kpi?.eligible_assessment?.delta || 0,
                description: 'Candidates eligible for assessment.'
              },
              {
                key: '2',
                label: 'Demo Eligible',
                value: schoolAnalytics?.application_kpi?.demo_eligible?.count || 0,
                delta: schoolAnalytics?.application_kpi?.demo_eligible?.delta || 0,
                description: 'Candidates eligible for demo.'
              },
              {
                key: '3',
                label: 'Interview Eligible',
                value: schoolAnalytics?.application_kpi?.interview_eligible?.count || 0,
                delta: schoolAnalytics?.application_kpi?.interview_eligible?.delta || 0,
                description: 'Candidates eligible for interview.'
              }
            ]} />

          <MetricCard title="Offers" value={schoolAnalytics?.offered_kpi?.offered?.count || 0} delta={schoolAnalytics?.offered_kpi?.offered?.delta || 0}
            description='Offers made and their acceptance rate.'
            items={[
              {
                key: '1',
                label: 'Avg Time to Hire',
                value: schoolAnalytics?.offered_kpi?.average_time_to_hire?.days || 0,
                delta: schoolAnalytics?.offered_kpi?.average_time_to_hire?.delta || 0,
                description: 'Average time to hire.'
              },
              {
                key: '2',
                label: 'Accepted',
                value: schoolAnalytics?.offered_kpi?.accepted?.count || 0,
                delta: schoolAnalytics?.offered_kpi?.accepted?.delta || 0,
                description: 'Offers accepted by candidates.'
              },
              {
                key: '3',
                label: 'Rejected',
                value: schoolAnalytics?.offered_kpi?.rejected?.count || 0,
                delta: schoolAnalytics?.offered_kpi?.rejected?.delta || 0,
                description: 'Offers rejected by candidates.'
              }
            ]} />

          <div className="col-span-1 lg:col-span-2 xl:col-span-3 border rounded-lg bg-white">
            <div className="border-b px-4 py-3">
              <CardTitle className="text-lg font-semibold text-gray-900">Hiring Funnel</CardTitle>
            </div>
            <div className="p-4">
              <HiringFunnelChart funnelData={schoolAnalytics?.hiring_funnel?.funnel_data} conversionRates={schoolAnalytics?.hiring_funnel?.conversion_rates} />
            </div>
          </div>

          <div className="border rounded-lg bg-white">
            <div className="border-b px-4 py-3">
              <CardTitle className="text-lg font-semibold text-gray-900">Gender Distribution</CardTitle>
            </div>
            <div className="p-4">
              <GenderDistributionChart demographics={schoolAnalytics?.demographics} />
            </div>
          </div>

          <div className="border rounded-lg bg-white">
            <div className="border-b px-4 py-3">
              <CardTitle className="text-lg font-semibold text-gray-900">Age Distribution</CardTitle>
            </div>
            <div className="p-4">
              <AgeDistributionChart demographics={schoolAnalytics?.demographics} />
            </div>
          </div>

          <div className="border rounded-lg bg-white">
            <div className="border-b px-4 py-3">
              <CardTitle className="text-lg font-semibold text-gray-900">City Distribution</CardTitle>
            </div>
            <div className="p-4">
              <CityDistributionChart demographics={schoolAnalytics?.demographics} />
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2 xl:col-span-3 border rounded-lg bg-white">
            <div className="border-b px-4 py-3">
              <CardTitle className="text-lg font-semibold text-gray-900">Applications Over Time</CardTitle>
            </div>
            <div className="p-4">
              <ApplicationsPerDayChart timelineData={schoolAnalytics?.timeline?.timeline_data} periodType={schoolAnalytics?.timeline?.period_type} />
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
