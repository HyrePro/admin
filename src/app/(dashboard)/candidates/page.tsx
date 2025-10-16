'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { useAuthStore } from '@/store/auth-store'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/api/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronRight, Search } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { IconMail, IconUser } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'

// Define the application type based on the RPC function return
interface Application {
  first_name: string
  last_name: string
  email: string
  phone: string
  city: string
  score: number
  demo_score: number
  application_status: string
  job_title: string
  created_at: string
  job_id: string
  application_id: string
}

// Fetcher function for school info
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

// Fetcher function for applications
const fetchApplications = async (
  schoolId: string,
  startIndex: number,
  endIndex: number,
  search: string,
  status: string
) => {
  console.log("Fetching applications for schoolId:", schoolId)
  if (!schoolId)
    return []

  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_applications_by_school', {
    p_school_id: schoolId,
    p_start_index: startIndex,
    p_end_index: endIndex,
    p_search: search,
    p_status: status
  })

  if (error) throw new Error(error.message)
  console.log("Candidate Data:", data)
  return data || []
}

export default function CandidatesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { schoolId: storeSchoolId } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => {
      clearTimeout(timer)
    }
  }, [searchTerm])

  // Fetch school info using SWR (more reliable than zustand store)
  const { data: schoolId, error: schoolError } = useSWR(
    user?.id ? ['school-info', user.id] : null,
    ([_, userId]) => fetchSchoolInfo(userId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  )

  // SWR handles caching, revalidation, and loading states
  const { data: applications, error, isLoading, isValidating } = useSWR(
    schoolId ? ['applications', schoolId, 0, 10, debouncedSearchTerm, statusFilter] : null,
    ([_, schoolId, startIndex, endIndex, search, status]) =>
      fetchApplications(schoolId, startIndex, endIndex, search, status),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  )

  // Format status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { text: string; color: string }> = {
      'in_progress': { text: 'New', color: 'bg-gray-100 text-gray-800' },
      'reviewed': { text: 'Reviewed', color: 'bg-blue-100 text-blue-800' },
      'interview': { text: 'Interview', color: 'bg-blue-100 text-blue-800' },
      'offer': { text: 'Offer', color: 'bg-green-100 text-green-800' },
      'rejected': { text: 'Rejected', color: 'bg-red-100 text-red-800' },
      'demo_ready': { text: 'Demo Ready', color: 'bg-yellow-100 text-yellow-800' }
    }

    return statusConfig[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
  }

  // Format assessment result
  const getAssessmentStatus = (score: number) => {
    if (score >= 70) return 'Passed'
    return 'Failed'
  }

  // Get the actual score to display
  const getDisplayScore = (application: Application) => {
    return application.score || application.demo_score || 0
  }

  return (
    <div className="space-y-6 p-6">


      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search candidates by name, job, or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Status: All</option>
            <option value="in_progress">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <Button variant="default" className="px-4 py-2">
            Apply Filters
          </Button>
          
          <Button 
            variant="outline" 
            className="px-4 py-2"
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('ALL')
            }}
          >
            Clear All
          </Button>
        </div> */}
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-normal text-sm border-r px-4">Candidate</TableHead>
              <TableHead className="font-normal text-sm border-r  px-4">Job Applied</TableHead>
              <TableHead className="font-normal text-sm border-r  px-4">Status</TableHead>
              <TableHead className="font-normal text-sm border-r px-0 ">
                <div className="flex items-center px-2 py-2">
                  <span>Assessment</span>
                </div>
                <div className="flex items-center flex-3 w-full border-t">
                  <span className='flex-1 font-normal text-sm border-r text-center py-1 px-1'>M</span>
                  <span className='flex-1 font-normal text-sm border-r text-center py-1 px-1'>V</span>
                  <span className='flex-1 font-normal text-sm text-center py-1 px-1'>I</span>
                </div>
              </TableHead>
              <TableHead className="font-normal text-sm border-r  px-4">Date Applied</TableHead>
              <TableHead className="font-normal text-sm px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isValidating ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-4 w-24 bg-gray-200" />
                      <Skeleton className="h-3 w-32 bg-gray-200" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32 bg-gray-200" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16 rounded-full bg-gray-200" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full bg-gray-200" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24 bg-gray-200" />
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20 bg-gray-200" />
                      <Skeleton className="h-8 w-20 bg-gray-200" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-red-500">
                  Error loading candidates: {error.message}
                </TableCell>
              </TableRow>
            ) : applications && applications.length > 0 ? (
              applications.map((application: Application, index: number) => (
                <TableRow key={index}>
                  <TableCell className='border-r px-4'>
                    <div>
                      <p className="font-medium">
                        {application.first_name} {application.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{application.email || 'Email not specified'}</p>
                    </div>
                  </TableCell>

                  <TableCell className='font-medium border-r  px-4'>{application.job_title}</TableCell>

                  <TableCell className='border-r px-4'>
                    <Badge className={getStatusBadge(application.application_status).color}>
                      <div className='font-medium p-1'>
                        {getStatusBadge(application.application_status).text}

                      </div>
                    </Badge>
                  </TableCell>

                  <TableCell className='border-r p-0 m-0 h-full relative'>
                    <div className="absolute inset-0 flex w-full h-full ">
                      <span className='flex-1 font-normal text-sm border-r text-center py-1 px-1 flex items-center justify-center'>{application.score}</span>
                      <span className='flex-1 font-normal text-sm border-r text-center py-1 px-1 flex items-center justify-center'>{application.demo_score || "-"}</span>
                      <span className='flex-1 font-normal text-sm text-center py-1 px-1 flex items-center justify-center'>-</span>
                    </div>
                  </TableCell>

                  <TableCell className='border-r px-4 font-medium'>
                    {application.created_at
                      ? new Date(application.created_at).toLocaleDateString()
                      : '-'}
                  </TableCell>



                  <TableCell className="flex px-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                router.push(`/jobs/${application.job_id}/${application.application_id}`);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No candidates found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

      </div>
      <div className="flex items-center justify-end space-x-4 text-xs mt-2">
        <div className="flex items-center space-x-1">
          <span className="font-medium">M</span>
          <span>- Multiple Choice Questions</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="font-medium">V</span>
          <span>- AI Video Assessment</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="font-medium">I</span>
          <span>- Interview Score</span>
        </div>
      </div>
    </div>
  )
}