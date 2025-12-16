'use client'

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/context/auth-context"
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/api/client'
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChartIcon } from "@/components/icons"

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

export default function AnalyticsPage() {
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

  // Loading state
  if (schoolLoading) {
    return (
      <AuthGuard>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-center py-16">
              <div className="animate-pulse text-lg">Loading analytics...</div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  // Error state
  if (schoolError) {
    return (
      <AuthGuard>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-center py-16">
              <div className="text-red-500">Error loading analytics data</div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  // Empty state - no schoolId
  if (!schoolId) {
    return (
      <AuthGuard>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-center py-16">
              <div className="text-gray-500">No school information found</div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  // Analytics page
  return (
    <AuthGuard>
      <div className="flex flex-1 flex-col px-4 pb-8">
        <div className="@container/main flex flex-1 flex-col gap-6">
          <div className="flex items-center gap-3 py-4">
            <BarChartIcon className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Analytics</h1>
          </div>
          
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hiring Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6 flex-col lg:flex-row">
                  <div className="lg:w-1/3">
                    <HiringProgressChart schoolId={schoolId} />
                  </div>
                  <div className="lg:w-2/3">
                    <WeeklyActivity schoolId={schoolId} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}