'use client'

import React, { useState } from 'react'

import { useAuth } from "@/context/auth-context"
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/api/client'
import dynamic from "next/dynamic"
import { BarChartIcon, TrendingUp, TrendingDown, UsersIcon, ClockIcon } from '@/components/icons'
import { SchoolKPIs } from '@/components/analytics/school-kpis'
import SchoolKPIOverview from '@/components/analytics/school-kpi-overview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import '@/styles/analytics.css'

// Import the analytics service
import { getSchoolAnalytics, SchoolAnalyticsData } from '@/lib/supabase/api/analyticsService';
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

// Fetcher functions - reusable and testable
const fetchSchoolInfo = async (userId: string) => {
  if (!userId) return null

  const supabase = createClient()
  const { data, error } = await supabase
    .from('admin_user_info')
    .select('school_id')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data?.school_id || null
}

const fetchSchoolAnalytics = async (schoolId: string, period: string = 'week') => {
  if (!schoolId) return null;

  try {
    const data = await getSchoolAnalytics(schoolId, period as 'day' | 'week' | 'month' | 'all');
    // Ensure the returned data is serializable
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error('Error fetching school analytics:', error);
    throw error;
  }
}



export default function AnalyticsPage() {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState('week'); // Default to 'This Week'

  // SWR handles caching, revalidation, and loading states
  const { data: schoolId, error: schoolError, isLoading: schoolLoading } = useSWR(
    user?.id ? ['school-info', user.id] : null,
    ([, userId]) => fetchSchoolInfo(userId),
    {
      revalidateOnFocus: false, // Don't refetch on window focus
      dedupingInterval: 60000, // Cache for 1 minute
    }
  )

  // Fetch school analytics data
  const { data: schoolAnalytics, error: kpiError, isLoading: kpiLoading } = useSWR(
    schoolId ? ['school-analytics', schoolId, dateRange] : null,
    ([, id, period]) => fetchSchoolAnalytics(id, period),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  // Loading state - Enhanced with KPI loading
  if (schoolLoading || kpiLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex-1 flex-col">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
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
  if (schoolError || kpiError) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex-1 flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
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
            <p className="text-red-800">Failed to load analytics data: {schoolError?.message || kpiError?.message || 'Unknown error'}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Empty state - no schoolId
  if (!schoolId) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex-1 flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
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
            <div className="text-gray-500">No school information found</div>
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
            <Select value={dateRange} onValueChange={setDateRange}>
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
                description: 'Jobs that were completed without a successful hire.'
              }
            ]}
          />
          <MetricCard title="Total Applications" value={schoolAnalytics?.application_kpi?.total_applications?.count || 0} delta={schoolAnalytics?.application_kpi?.total_applications?.delta || 0}
            description='Total applications is the number of candidates who have applied for jobs.'
            items={[
              {
                key: '1',
                label: 'Assessment Eligible',
                value: schoolAnalytics?.application_kpi?.eligible_assessment?.count || 0,
                delta: schoolAnalytics?.application_kpi?.eligible_assessment?.delta || 0,
                description: 'Candidates eligible for assessment.'
              },
              {
                key: '2',
                label: 'Demo Eligible',
                value: schoolAnalytics?.application_kpi?.demo_eligible?.count || 0,
                delta: schoolAnalytics?.application_kpi?.demo_eligible?.delta || 0,
                description: 'Candidates eligible for demo round.'
              },
              {
                key: '3',
                label: 'Interview Eligible',
                value: schoolAnalytics?.application_kpi?.interview_eligible?.count || 0,
                delta: schoolAnalytics?.application_kpi?.interview_eligible?.delta || 0,
                description: 'Candidates eligible for interview.'
              }
            ]}
          />
          <MetricCard title="Offers" value={schoolAnalytics?.offered_kpi?.offered?.count || 0} delta={schoolAnalytics?.offered_kpi?.offered?.delta || 0}
            description='Offer statistics for hired candidates.'
            items={[
              {
                key: '1',
                label: 'Time to Hire',
                value: schoolAnalytics?.offered_kpi?.average_time_to_hire?.days || 0,
                delta: schoolAnalytics?.offered_kpi?.average_time_to_hire?.delta || 0,
                description: 'Average time from application to hire.'
              },
              {
                key: '2',
                label: 'Offer Accepted',
                value: schoolAnalytics?.offered_kpi?.accepted?.count || 0,
                delta: schoolAnalytics?.offered_kpi?.accepted?.delta || 0,
                description: 'Number of offers accepted by candidates.'
              },
              {
                key: '3',
                label: 'Offer Declined',
                value: schoolAnalytics?.offered_kpi?.rejected?.count || 0,
                delta: schoolAnalytics?.offered_kpi?.rejected?.delta || 0,
                description: 'Number of offers declined by candidates.'
              }
            ]}
          />
        </div>
        {/* Hiring Funnel */}
        <div className="mt-8">
          <HiringFunnelChart funnelData={schoolAnalytics?.hiring_funnel?.funnel_data} conversionRates={schoolAnalytics?.hiring_funnel?.conversion_rates} />
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <GenderDistributionChart demographics={schoolAnalytics?.demographics} />
          <AgeDistributionChart demographics={schoolAnalytics?.demographics} />
          <CityDistributionChart demographics={schoolAnalytics?.demographics} />
        </div>
        <div className='mt-8 mb-8'>
          <ApplicationsPerDayChart timelineData={schoolAnalytics?.timeline?.timeline_data} periodType={schoolAnalytics?.timeline?.period_type} />
        </div>
      </div>
    </div>
    </div>
  )
}