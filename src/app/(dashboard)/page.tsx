'use client'
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Plus, Users, Briefcase, TrendingUp, TvMinimalIcon, BookText, ChevronRight } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/api/client'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty"
import { useRouter } from "next/navigation"
import { DashboardCard } from "@/components/dashboard-card"
import { DashboardTable } from "@/components/dashboard-table"
import { useState } from "react"
import { ApplicationDistribution } from "@/components/application-distribution"
import HiringProgressChart from "@/components/hiring-progress-chart"
import WeeklyActivity from "@/components/weekly-activity-chart"
import { CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SchoolJobsContainer } from "@/components/school-job-campaign"
import HiringSummaryBar from "@/components/hiring-metric"



interface DashboardStats {
  total_applications: number
  interview_ready: number
  offered: number
}

// Fetcher function - reusable and testable
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

// Fetcher function for jobs
const fetchJobs = async (schoolId: string) => {
  if (!schoolId) return []

  const supabase = createClient()
  const { data, error } = await supabase
    .from('jobs')
    .select('id')
    .eq('school_id', schoolId)

  if (error) throw error
  return data || []
}

// Fetcher function for dashboard stats
const fetchDashboardStats = async (schoolId: string): Promise<DashboardStats | null> => {
  if (!schoolId) return null

  const supabase = createClient()
  const { data, error } = await supabase
    .rpc('get_school_dashboard_stats', { p_school_id: schoolId })
    .single()

  if (error) throw error
  return data as DashboardStats || null
}

export default function Page() {
  const { user } = useAuth()
  const router = useRouter()

  // SWR handles caching, revalidation, and loading states
  const { data: schoolId, error: schoolError, isLoading: schoolLoading } = useSWR(
    user?.id ? ['school-info', user.id] : null,
    ([_, userId]) => fetchSchoolInfo(userId),
    {
      revalidateOnFocus: false, // Don't refetch on window focus
      dedupingInterval: 60000, // Cache for 1 minute
    }
  )

  // Fetch jobs based on schoolId
  const { data: jobs, error: jobsError, isLoading: jobsLoading } = useSWR(
    schoolId ? ['jobs', schoolId] : null,
    ([_, schoolId]) => fetchJobs(schoolId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  // Fetch dashboard stats based on schoolId
  const { data: dashboardStats, error: statsError, isLoading: statsLoading } = useSWR<DashboardStats | null>(
    schoolId ? ['dashboard-stats', schoolId] : null,
    ([_, schoolId]) => fetchDashboardStats(schoolId as string),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  // Loading state
  if (schoolLoading || jobsLoading || statsLoading) {
    return (
      <AuthGuard>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-center py-16">
              <div className="animate-pulse text-lg">Loading dashboard...</div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  // Error state
  if (schoolError || jobsError || statsError) {
    return (
      <AuthGuard>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-center py-16">
              <div className="text-red-500">Error loading dashboard data</div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  // Empty state - no schoolId or no jobs
  if (!schoolId || !jobs || jobs.length === 0) {
    return (
      <AuthGuard>
        <div className="flex flex-1 flex-col pb-8">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <Empty className="border border-dashed m-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Briefcase className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>Welcome to Your Dashboard</EmptyTitle>
                <EmptyDescription>
                  Get started by creating your first job posting to begin hiring for your school.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  onClick={() => router.push('/jobs/create-job-post')}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Job
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        </div>
      </AuthGuard>
    )
  }

  // Dashboard with job count
  return (
    <AuthGuard>
      <div className="flex flex-1 flex-col px-4 pb-8 pt-4">
        <div className="@container/main flex flex-1 flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Active Jobs"
              value={jobs.length}
              icon={<Briefcase className="h-5 w-5 text-emerald-600" />} />

            <DashboardCard
              title="Total Applications"
              value={dashboardStats?.total_applications || 0}
              icon={<Users className="h-5 w-5 text-rose-600" />} />

            <DashboardCard
              title="Interviews Scheduled"
              value={dashboardStats?.interview_ready || 0}
              icon={<TvMinimalIcon className="h-5 w-5 text-amber-600" />} />

            <DashboardCard
              title="Offers Sent"
              value={dashboardStats?.offered || 0}
              icon={<BookText className="h-5 w-5 text-violet-600" />} />
          </div>
          {/* <HiringSummaryBar /> */}

          <div>
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">Active Job Campaigns</CardTitle>
              <CardAction>
                <Button variant="link" onClick={() => router.push('/jobs')}>
                  See all campaigns &gt;
                </Button>
              </CardAction>
            </div>

            <SchoolJobsContainer schoolId={schoolId} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">Progress and Activity</CardTitle>
              <CardAction>
                <Button variant="link" onClick={() => router.push('/analytics')}>
                  See all analytics &gt;
                </Button>
              </CardAction>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              <div className="lg:w-1/3">
                <HiringProgressChart schoolId={schoolId} />
              </div>
              <div className="lg:w-2/3">
                <WeeklyActivity schoolId={schoolId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

function TabsSection({ schoolId }: { schoolId: string }) {

  return (
    <div className="space-y-3">
      <h2 className="text-base font-medium">
        Active Jobs
      </h2>
      <div>
        <DashboardTable schoolId={schoolId} />
      </div>
    </div>
  )
}