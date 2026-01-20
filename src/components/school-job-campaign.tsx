import React from 'react'
import { MoreVertical } from "@/components/icons"
import { Card, CardDescription, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useRouter } from 'next/navigation'
import { useSchoolJobs } from '@/hooks/useSchoolJobs';

// =====================
// Type Definitions
// =====================

interface Applicant {
  firstName: string
  lastName: string
  avatar: string | null
}

interface JobData {
  id: string
  title: string
  description: string
  plan: string
  max_applications: number
  recent_applicants: Applicant[]
  candidates_evaluated: number
  demo_completed: number
  interview_ready: number
  offered: number
  created_at: string
}

interface JobCardProps {
  data: JobData
  router?: ReturnType<typeof useRouter>
}

interface SchoolJobsContainerProps {
  schoolId: string
}

// =====================
// SchoolJobsContainer
// =====================

const SchoolJobsContainer: React.FC<SchoolJobsContainerProps> = ({ schoolId }) => {
  const router = useRouter()
  
  const {
    data: jobs = [],
    isLoading: loading,
    error: queryError,
    refetch
  } = useSchoolJobs(schoolId)
  
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'An unknown error occurred') : null

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-full mb-4" />
            <div className="flex gap-2 mb-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
            </div>
            <div className="h-2 bg-gray-200 rounded w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">Error loading jobs: {error}</p>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-600 text-lg">No jobs found for this school.</p>
      </div>
    )
  }

  const placeholderCount = Math.max(0, 3 - jobs.length)
  const placeholders = Array.from({ length: placeholderCount }, (_, i) => (
    <div
      key={`placeholder-${i}`}
      className="group relative flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all duration-300 ease-out overflow-hidden gap-3 min-h-[200px]"
      onClick={() => router.push('/jobs/create-job-post')}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-100/0 group-hover:from-blue-50/50 group-hover:to-blue-100/30 transition-all duration-300" />

      <div className="relative flex flex-col items-center justify-center flex-1 text-center">
        <div className="relative inline-block mb-3">
          <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-lg group-hover:bg-blue-400/40 transition-all duration-300" />
          <div className="relative w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300 shadow-sm">
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors duration-300">
            Create New Job
          </h3>
          <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
            Click to add a new campaign
          </p>
        </div>
      </div>
    </div>
  ))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {jobs.map((job) => (
        <JobCard key={job.id} data={job} router={router} />
      ))}
      {placeholders}
    </div>
  )
}

// =====================
// JobCard
// =====================

const JobCard: React.FC<JobCardProps> = ({ data, router: externalRouter }) => {
  const internalRouter = useRouter()
  const router = externalRouter || internalRouter

  if (!data) return null

  const {
    id,
    title,
    description,
    plan,
    max_applications,
    recent_applicants = [],
    candidates_evaluated = 0
  } = data

  const pct =
    max_applications > 0
      ? Math.min(100, Math.round((candidates_evaluated / max_applications) * 100))
      : 0

  const goToJobDetails = () => {
    router.push(`/jobs/${id}`)
  }

  return (
    <Card
      className="flex flex-col p-3 border-1 border-gray-200 shadow-none hover:shadow-lg transition-shadow cursor-pointer gap-3"
      onClick={goToJobDetails}
    >
      <div className="flex justify-between">
        <div className="flex-1">
          <CardTitle className="p-0 m-0 text-base font-medium">
            {title}
          </CardTitle>

          <CardDescription className="text-gray-600 mt-1 mb-2 line-clamp-2">
            {description || "No description"}
          </CardDescription>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/jobs/${id}`)
          }}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <Badge
          variant="outline"
          className="border-gray-300 text-black text-xs font-semibold bg-transparent"
        >
          {plan}
        </Badge>

        <div className="flex -space-x-1.5">
          {recent_applicants.slice(0, 3).map((a, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-700 text-xs"
            >
              {a.avatar ? (
                <img
                  src={a.avatar}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                `${a.firstName?.[0] || ""}${a.lastName?.[0] || ""}`
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-sm text-gray-600 font-semibold">
          {pct}%
        </div>
      </div>
    </Card>
  )
}

export { JobCard, SchoolJobsContainer }
export type {
  JobData,
  Applicant,
  JobCardProps,
  SchoolJobsContainerProps
}
