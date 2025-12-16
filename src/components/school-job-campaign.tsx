import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, TvMinimalIcon, BookText, MoreVertical } from "@/components/icons";
import { createClient } from '@/lib/supabase/api/client';
import { Card, CardDescription, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useRouter } from 'next/navigation';

// Type Definitions
interface Applicant {
    firstName: string;
    lastName: string;
    avatar: string | null;
}

interface JobData {
    id: string;
    title: string;
    description: string;
    plan: string;
    max_applications: number;
    recent_applicants: Applicant[];
    candidates_evaluated: number;
    demo_completed: number;
    interview_ready: number;
    offered: number;
    created_at: string;
}

interface JobCardProps {
    data: JobData;
}

interface SchoolJobsContainerProps {
    schoolId: string;
}

const SchoolJobsContainer: React.FC<SchoolJobsContainerProps> = ({ schoolId }) => {
  const [jobs, setJobs] = useState<JobData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!schoolId) return

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { data, error: err } = await supabase.rpc("get_school_jobs_data", {
          p_school_id: schoolId
        })
        if (err) throw err

        setJobs(data || [])
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [schoolId])

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {jobs.map((job) => (
        <JobCard key={job.id} data={job} />
      ))}
    </div>
  )
}


const JobCard: React.FC<JobCardProps> = ({ data }) => {
  const router = useRouter()
  if (!data) return null

  const {
    id,
    title,
    description,
    plan,
    max_applications,
    recent_applicants = [],
    candidates_evaluated = 0,
    interview_ready = 0,
    offered = 0
  } = data

  const pct =
    max_applications > 0
      ? Math.min(100, Math.round((candidates_evaluated / max_applications) * 100))
      : 0

  const navigate = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return
    router.push(`/jobs/${id}`)
  }

  return (
    <Card
      className="flex flex-col p-3 border-1 border-gray-200 shadow-none hover:shadow-lg transition-shadow cursor-pointer gap-3"
      onClick={navigate}
    >
      <div className="flex justify-between">
        <div className="flex-1">
          <CardTitle className="p-0 m-0 text-base font-medium">{title}</CardTitle>

          <CardDescription className="text-gray-600 mt-1 mb-2 line-clamp-2">
            {description || "No description"}
          </CardDescription>

          
        </div>

        <Button variant="ghost" size="icon" className="text-gray-400">
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
        <div className="text-sm text-gray-600 font-semibold">{pct}%</div>
      </div>
    </Card>
  )
}


// Export components
export { JobCard, SchoolJobsContainer };
export type { JobData, Applicant, JobCardProps, SchoolJobsContainerProps };