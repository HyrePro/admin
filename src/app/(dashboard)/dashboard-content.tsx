'use client'
import { Button } from "@/components/ui/button"
import { Plus, Users, Briefcase, TvMinimalIcon, BookText } from "@/components/icons"
import { useAuth } from "@/context/auth-context"
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
import dynamic from "next/dynamic"
import { CardAction, CardTitle } from "@/components/ui/card"
import { SchoolJobsContainer } from "@/components/school-job-campaign"

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

const HiringSummaryBar = dynamic(() => import("@/components/hiring-metric").then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
  )
})

interface DashboardStats {
  total_applications: number
  interview_ready: number
  offered: number
}

interface DashboardContentProps {
  schoolId?: string | null;
  jobs?: { id: string }[];
  dashboardStats?: DashboardStats | null;
  error?: boolean;
}

export function DashboardContent({ 
  schoolId = null, 
  jobs = [], 
  dashboardStats = null, 
  error = false 
}: DashboardContentProps) {
  const { user } = useAuth()
  const router = useRouter()

  // Loading state would be handled by the server component before this renders
  // Error state
  if (error) {
    return (
      <div className="flex flex-1 flex-col h-full max-h-[calc(100vh-100px)] overflow-y-auto">
        <div className="@container/main flex flex-col gap-2">
          <div className="flex items-center justify-center py-16">
            <div className="text-red-500">Error loading dashboard data</div>
          </div>
        </div>
      </div>
    )
  }

  // Empty state - no schoolId or no jobs
  if (!schoolId || !jobs || jobs.length === 0) {
    return (
      <div className="flex flex-1 flex-col pb-8 h-full max-h-[calc(100vh-100px)] overflow-y-auto">
        <div className="@container/main flex flex-col gap-2">
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
    )
  }

  // Dashboard with job count
  return (
    <div className="flex flex-1 flex-col px-4 pb-8 pt-4 h-full max-h-[calc(100vh)] overflow-y-auto">
      <div className="@container/main flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Active Jobs"
            value={jobs.length}
            icon={<Briefcase className="h-5 w-5 text-emerald-600" />}
            onClick={() => router.push("/jobs")} />
    
          <DashboardCard
            title="Total Applications"
            value={dashboardStats?.total_applications || 0}
            icon={<Users className="h-5 w-5 text-rose-600" />}
            onClick={() => router.push("/candidates")} />
    
          <DashboardCard
            title="Interviews Scheduled"
            value={dashboardStats?.interview_ready || 0}
            icon={<TvMinimalIcon className="h-5 w-5 text-amber-600" />}
            onClick={() => router.push("/interviews")} />
    
          <DashboardCard
            title="Offers Sent"
            value={dashboardStats?.offered || 0}
            icon={<BookText className="h-5 w-5 text-violet-600" />}
            onClick={() => router.push("/candidates")} />
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
    
          <SchoolJobsContainer schoolId={schoolId || ''} />
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
            <div className="w-full lg:w-1/3">
              <HiringProgressChart schoolId={schoolId || ''} />
            </div>
            <div className="w-full lg:w-2/3">
              <WeeklyActivity schoolId={schoolId || ''} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}