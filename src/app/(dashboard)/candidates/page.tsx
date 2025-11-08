'use client'

import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { useAuth } from '@/context/auth-context'
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
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import '@/styles/candidates.css'
import { statusColors } from '../../../../utils/statusColor'

// Types
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

interface ApplicationsResponse {
  applications: Application[]
  total_count: number
}

// Constants
const PAGE_SIZE = 10
const DEBOUNCE_DELAY = 500
const CACHE_TIME = 60000
const STALE_TIME = 30000

const STATUS_CONFIG = {
  in_progress: { text: 'In Progress', color: statusColors.in_progress },
  application_submitted: { text: 'Application Submitted', color: statusColors.application_submitted },
  assessment_in_progress: { text: 'Assessment In Progress', color: statusColors.assessment_in_progress },
  assessment_in_evaluation: { text: 'Assessment In Evaluation', color: statusColors.assessment_in_evaluation },
  assessment_evaluated: { text: 'Assessment Evaluated', color: statusColors.assessment_evaluated },
  assessment_questionnaire_creation: { text: 'Assessment Questionnaire Creation', color: statusColors.assessment_questionnaire_creation },
  assessment_ready: { text: 'Assessment Ready', color: statusColors.assessment_ready },
  assessment_failed: { text: 'Assessment Failed', color: statusColors.assessment_failed },
  demo_creation: { text: 'Demo Creation', color: statusColors.demo_creation },
  demo_ready: { text: 'Demo Ready', color: statusColors.demo_ready },
  demo_in_progress: { text: 'Demo In Progress', color: statusColors.demo_in_progress },
  demo_in_evaluation: { text: 'Demo In Evaluation', color: statusColors.demo_in_evaluation },
  demo_evaluated: { text: 'Demo Evaluated', color: statusColors.demo_evaluated },
  demo_failed: { text: 'Demo Failed', color: statusColors.demo_failed },
  interview_in_progress: { text: 'Interview In Progress', color: statusColors.interview_in_progress },
  interview_ready: { text: 'Interview Ready', color: statusColors.interview_ready },
  paused: { text: 'Paused', color: statusColors.paused },
  completed: { text: 'Completed', color: statusColors.completed },
  suspended: { text: 'Suspended', color: statusColors.suspended },
  appealed: { text: 'Appealed', color: statusColors.appealed },
  withdrawn: { text: 'Withdrawn', color: statusColors.withdrawn },
  offered: { text: 'Offered', color: statusColors.offered },
} as const

// Fetchers
const fetchSchoolInfo = async (userId: string): Promise<string | null> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('admin_user_info')
    .select('school_id')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data?.school_id || null
}

const fetchApplicationsWithCount = async (
  schoolId: string,
  startIndex: number,
  endIndex: number,
  search: string,
  status: string
): Promise<ApplicationsResponse> => {
  if (!schoolId) return { applications: [], total_count: 0 }

  const supabase = createClient()
  
  const [applicationsResult, countResult] = await Promise.all([
    supabase.rpc('get_applications_by_school', {
      p_school_id: schoolId,
      p_start_index: startIndex,
      p_end_index: endIndex,
      p_search: search,
      p_status: status
    }),
    supabase.rpc('get_applications_count_by_school', {
      p_school_id: schoolId,
      p_search: search,
      p_status: status
    })
  ])

  if (applicationsResult.error) throw applicationsResult.error
  if (countResult.error) throw countResult.error

  return {
    applications: applicationsResult.data || [],
    total_count: countResult.data || 0
  }
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

export default function CandidatesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY)

  useEffect(() => {
    setCurrentPage(0)
  }, [debouncedSearchTerm])

  const { data: schoolId } = useSWR(
    user?.id ? `school-${user.id}` : null,
    () => fetchSchoolInfo(user!.id),
    {
      revalidateOnFocus: false,
      dedupingInterval: CACHE_TIME,
    }
  )

  const startIndex = currentPage * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE

  const { 
    data, 
    error,
    isLoading,
    isValidating,
    mutate 
  } = useSWR(
    schoolId 
      ? `apps-${schoolId}-${startIndex}-${endIndex}-${debouncedSearchTerm}`
      : null,
    () => fetchApplicationsWithCount(
      schoolId!,
      startIndex,
      endIndex,
      debouncedSearchTerm,
      'ALL'
    ),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: STALE_TIME,
      refreshInterval: 30000,
    }
  )

  useEffect(() => {
    if (!schoolId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel('job_applications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_applications',
          filter: `job_id=in.(SELECT id FROM jobs WHERE school_id=eq.${schoolId})`
        },
        () => mutate()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [schoolId, mutate])

  const applications = data?.applications || []
  const totalCount = data?.total_count || 0
  
  const { totalPages, canGoNext, canGoPrevious } = useMemo(() => {
    const pages = Math.ceil(totalCount / PAGE_SIZE)
    return {
      totalPages: pages,
      canGoNext: currentPage < pages - 1 && totalCount > 0,
      canGoPrevious: currentPage > 0
    }
  }, [totalCount, currentPage])

  const getStatusBadge = useCallback((status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || 
      { text: status, color: 'status-default' }
  }, [])

  const handlePreviousPage = useCallback(() => {
    if (canGoPrevious) setCurrentPage(prev => prev - 1)
  }, [canGoPrevious])

  const handleNextPage = useCallback(() => {
    if (canGoNext) setCurrentPage(prev => prev + 1)
  }, [canGoNext])

  const handleViewApplication = useCallback((jobId: string, applicationId: string) => {
    router.push(`/jobs/${jobId}/${applicationId}`)
  }, [router])

  const showLoading = isLoading || !schoolId
  const showValidating = isValidating && !isLoading

  return (
    <div className="candidates-container">
      <div className="candidates-header"> 
        <h1 className="candidates-title">Candidates</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/jobs')}
          className='btn-invite'
        >
          <Plus className="btn-icon" />
          Invite Candidate
        </Button>
      </div>

      <div className="search-container">
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search candidates by name, job, or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Search candidates"
          />
        </div>
      </div>

      <div className="table-container">
        {showValidating && (
          <div className="loading-indicator">
            <div className="loading-pulse" />
          </div>
        )}
        
        <div className="table-scroll">
          <Table>
            <TableHeader className="table-header">
              <TableRow>
                <TableHead className="table-head table-head-border">
                  <div className="table-head-content">Candidate</div>
                </TableHead>
                <TableHead className="table-head table-head-border">
                  <div className="table-head-content">Job Applied</div>
                </TableHead>
                <TableHead className="table-head table-head-border">
                  <div className="table-head-content">Status</div>
                </TableHead>
                <TableHead className="table-head table-head-border table-head-assessment">
                  <div className="assessment-header">
                    <span>Assessment</span>
                  </div>
                  <div className="assessment-subheader">
                    <span className="assessment-col">M</span>
                    <span className="assessment-col">V</span>
                    <span className="assessment-col-last">I</span>
                  </div>
                </TableHead>
                <TableHead className="table-head table-head-border">
                  <div className="table-head-content">Date Applied</div>
                </TableHead>
                <TableHead className="table-head table-head-actions">
                  <div className="table-head-content">Actions</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="table-body">
              {showLoading ? (
                <LoadingSkeleton />
              ) : error ? (
                <ErrorRow error={error} />
              ) : applications.length > 0 ? (
                applications.map((app) => (
                  <ApplicationRow
                    key={`${app.application_id}-${app.job_id}`}
                    application={app}
                    getStatusBadge={getStatusBadge}
                    onView={handleViewApplication}
                  />
                ))
              ) : (
                <EmptyRow />
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {!showLoading && totalCount > 0 && (
        <Pagination
          startIndex={startIndex}
          endIndex={Math.min(endIndex, totalCount)}
          total={totalCount}
          currentPage={currentPage}
          totalPages={totalPages}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          onPrevious={handlePreviousPage}
          onNext={handleNextPage}
          isLoading={isValidating}
        />
      )}

      <AssessmentLegend />
    </div>
  )
}

// Memoized Sub-components

const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell className="table-cell-border">
            <div className="cell-content">
              <Skeleton className="skeleton-primary" />
              <Skeleton className="skeleton-secondary" />
            </div>
          </TableCell>
          <TableCell className="table-cell-border">
            <div className="cell-content">
              <Skeleton className="skeleton-primary" />
            </div>
          </TableCell>
          <TableCell className="table-cell-border">
            <div className="cell-content">
              <Skeleton className="skeleton-badge" />
            </div>
          </TableCell>
          <TableCell className="table-cell-border table-cell-assessment">
            <div className="assessment-scores">
              <div className="assessment-score-col">
                <Skeleton className="skeleton-score" />
              </div>
              <div className="assessment-score-col">
                <Skeleton className="skeleton-score" />
              </div>
              <div className="assessment-score-col-last">
                <Skeleton className="skeleton-score" />
              </div>
            </div>
            <div className="assessment-spacer">&nbsp;</div>
          </TableCell>
          <TableCell className="table-cell-border">
            <div className="cell-content">
              <Skeleton className="skeleton-date" />
            </div>
          </TableCell>
          <TableCell>
            <div className="cell-content">
              <Skeleton className="skeleton-action" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
})

const ErrorRow = memo(function ErrorRow({ error }: { error: Error }) {
  return (
    <TableRow>
      <TableCell colSpan={6} className="error-cell">
        Error loading candidates: {error.message}
      </TableCell>
    </TableRow>
  )
})

const EmptyRow = memo(function EmptyRow() {
  return (
    <TableRow>
      <TableCell colSpan={6} className="empty-cell">
        No candidates found matching your criteria.
      </TableCell>
    </TableRow>
  )
})

interface ApplicationRowProps {
  application: Application
  getStatusBadge: (status: string) => { text: string; color: string }
  onView: (jobId: string, applicationId: string) => void
}

const ApplicationRow = memo(function ApplicationRow({ 
  application, 
  getStatusBadge, 
  onView 
}: ApplicationRowProps) {
  const statusBadge = getStatusBadge(application.application_status)
  
  return (
    <TableRow className="table-row-hover">
      <TableCell className="table-cell-border">
        <div className="cell-content">
          <p className="candidate-name">
            {application.first_name} {application.last_name}
          </p>
          <p className="candidate-email">
            {application.email || 'Email not specified'}
          </p>
        </div>
      </TableCell>

      <TableCell className="table-cell-border candidate-job">
        <div className="cell-content">
          {application.job_title}
        </div>
      </TableCell>

      <TableCell className="table-cell-border">
        <div className="cell-content">
          <Badge className={statusBadge.color}>
            <div className="badge-text">{statusBadge.text}</div>
          </Badge>
        </div>
      </TableCell>

      <TableCell className="table-cell-border table-cell-assessment">
        <div className="assessment-scores">
          <span className="assessment-value">
            {application.score}
          </span>
          <span className="assessment-value">
            {application.demo_score || "-"}
          </span>
          <span className="assessment-value-disabled">
            -
          </span>
        </div>
        <div className="assessment-spacer">&nbsp;</div>
      </TableCell>

      <TableCell className="table-cell-border candidate-date">
        <div className="cell-content">
          {application.created_at
            ? new Date(application.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : '-'}
        </div>
      </TableCell>

      <TableCell className="table-cell-actions">
        <div className="cell-content">
          <Button
            variant="ghost"
            size="sm"
            className="action-btn"
            onClick={() => onView(application.job_id, application.application_id)}
            aria-label={`View application for ${application.first_name} ${application.last_name}`}
          >
            <ChevronRight className="btn-icon" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
})

interface PaginationProps {
  startIndex: number
  endIndex: number
  total: number
  currentPage: number
  totalPages: number
  canGoPrevious: boolean
  canGoNext: boolean
  onPrevious: () => void
  onNext: () => void
  isLoading: boolean
}

const Pagination = memo(function Pagination({
  startIndex,
  endIndex,
  total,
  currentPage,
  totalPages,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  isLoading
}: PaginationProps) {
  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Showing <span className="pagination-value">{startIndex + 1}</span> to{' '}
        <span className="pagination-value">{endIndex}</span> of{' '}
        <span className="pagination-value">{total}</span> candidates
      </div>
      <div className="pagination-controls">
        <span className="pagination-page">
          Page {currentPage + 1} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!canGoPrevious || isLoading}
          className="pagination-btn"
        >
          <ChevronLeft className="btn-icon" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!canGoNext || isLoading}
          className="pagination-btn"
        >
          Next
          <ChevronRight className="btn-icon" />
        </Button>
      </div>
    </div>
  )
})

const AssessmentLegend = memo(function AssessmentLegend() {
  return (
    <div className="legend-container">
      <div className="legend-item">
        <span className="legend-key">M</span>
        <span>- Multiple Choice Questions</span>
      </div>
      <div className="legend-item">
        <span className="legend-key">V</span>
        <span>- AI Video Assessment</span>
      </div>
      <div className="legend-item">
        <span className="legend-key">I</span>
        <span>- Interview Score</span>
      </div>
    </div>
  )
})