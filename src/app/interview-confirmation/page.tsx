// pages/interview-confirmation.tsx (for admin.hyriki.com)
'use client'
import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

// Type Definitions
interface SuggestedTime {
  date: string
  time: string
}

interface Panelist {
  email: string
  name: string
}

interface School {
  name: string
}

interface JobDetails {
  title: string
  schools: School
}

interface JobApplication {
  candidate_name: string
}

interface InterviewSchedule {
  candidate_email: string
  interview_date: string
  interview_time: string
  duration_minutes: number
  type: 'online' | 'offline'
  panelists: Panelist[]
  jobs: JobDetails
  job_applications: JobApplication[]
}

interface InterviewConfirmation {
  id: string
  interview_id: string
  recipient_email: string
  recipient_type: 'candidate' | 'panelist'
  status: 'pending' | 'accepted' | 'declined' | 'reschedule_requested'
  response_token: string
  responded_at: string | null
  interview_schedule: InterviewSchedule
}

interface ConfirmationResponse {
  success: boolean
  message: string
  status?: string
  all_responded?: boolean
  interview_status?: string
  error?: string
}

type ConfirmAction = 'accept' | 'decline' | 'reschedule'

// Utility Functions
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0]
}

// Components
const SuccessScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Response Submitted</h1>
      <p className="text-gray-600 mb-6">
        Thank you for your response. The HR team has been notified of your decision.
      </p>
      <Link
        href="/dashboard"
        className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  </div>
)

const InvalidLinkScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900">Invalid Link</h1>
      <p className="mt-2 text-gray-600">Please check your email for the correct link.</p>
    </div>
  </div>
)

const ErrorAlert: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
    <div className="flex">
      <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-red-800">{message}</p>
    </div>
  </div>
)

interface InterviewDetailsHeaderProps {
  jobTitle: string
  schoolName: string
}

const InterviewDetailsHeader: React.FC<InterviewDetailsHeaderProps> = ({ 
  jobTitle, 
  schoolName 
}) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">{jobTitle}</h2>
      <p className="text-gray-600 mt-1">{schoolName}</p>
    </div>
    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
      Panelist
    </span>
  </div>
)

interface DetailItemProps {
  icon: React.ReactNode
  label: string
  value: string
}

const DetailItem: React.FC<DetailItemProps> = ({ icon, label, value }) => (
  <div>
    <div className="flex items-center text-sm text-gray-500 mb-1">
      {icon}
      {label}
    </div>
    <p className="font-semibold text-gray-900">{value}</p>
  </div>
)

interface InterviewDetailsCardProps {
  confirmation: InterviewConfirmation
}

const InterviewDetailsCard: React.FC<InterviewDetailsCardProps> = ({ confirmation }) => {
  const { interview_schedule } = confirmation
  const candidateName = interview_schedule.job_applications?.[0]?.candidate_name || 
                        interview_schedule.candidate_email

  const otherPanelists = useMemo(() => 
    interview_schedule.panelists.filter(p => p.email !== confirmation.recipient_email),
    [interview_schedule.panelists, confirmation.recipient_email]
  )

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border border-gray-100">
      <InterviewDetailsHeader
        jobTitle={interview_schedule.jobs.title}
        schoolName={interview_schedule.jobs.schools.name}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <DetailItem
            icon={
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            label="Candidate"
            value={candidateName}
          />

          <DetailItem
            icon={
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            label="Interview Date"
            value={formatDate(interview_schedule.interview_date)}
          />
        </div>

        <div className="space-y-4">
          <DetailItem
            icon={
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Time"
            value={interview_schedule.interview_time}
          />

          <DetailItem
            icon={
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            label="Duration & Type"
            value={`${interview_schedule.duration_minutes} minutes • ${
              interview_schedule.type === 'online' ? 'Online (Google Meet)' : 'In-person'
            }`}
          />
        </div>
      </div>

      {otherPanelists.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Other Panel Members</h3>
          <div className="flex flex-wrap gap-2">
            {otherPanelists.map((panelist, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {panelist.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface ActionButtonProps {
  onClick: () => void
  disabled: boolean
  variant: 'accept' | 'reschedule' | 'decline'
  children: React.ReactNode
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  onClick, 
  disabled, 
  variant, 
  children 
}) => {
  const variantStyles = {
    accept: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
    reschedule: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
    decline: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 px-6 ${variantStyles[variant]} text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
    >
      {children}
    </button>
  )
}

interface ActionButtonsProps {
  loading: boolean
  onAccept: () => void
  onReschedule: () => void
  onDecline: () => void
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  loading, 
  onAccept, 
  onReschedule, 
  onDecline 
}) => (
  <div className="bg-white rounded-xl shadow-lg p-8 space-y-4">
    <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
      Please Confirm Your Availability
    </h2>
    
    <ActionButton onClick={onAccept} disabled={loading} variant="accept">
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Accept Panel Request
    </ActionButton>

    <ActionButton onClick={onReschedule} disabled={loading} variant="reschedule">
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      Suggest Alternative Time
    </ActionButton>

    <ActionButton onClick={onDecline} disabled={loading} variant="decline">
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Decline Panel Request
    </ActionButton>
  </div>
)

interface TimeSlotInputProps {
  time: SuggestedTime
  index: number
  onUpdate: (index: number, field: 'date' | 'time', value: string) => void
  onRemove: (index: number) => void
  canRemove: boolean
  minDate: string
}

const TimeSlotInput: React.FC<TimeSlotInputProps> = ({ 
  time, 
  index, 
  onUpdate, 
  onRemove, 
  canRemove,
  minDate 
}) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <div className="flex gap-3 items-start">
      <div className="flex-1">
        <label htmlFor={`date-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
          Date
        </label>
        <input
          id={`date-${index}`}
          type="date"
          value={time.date}
          onChange={(e) => onUpdate(index, 'date', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          min={minDate}
          required
        />
      </div>
      <div className="flex-1">
        <label htmlFor={`time-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
          Time
        </label>
        <input
          id={`time-${index}`}
          type="time"
          value={time.time}
          onChange={(e) => onUpdate(index, 'time', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        />
      </div>
      {canRemove && (
        <button
          onClick={() => onRemove(index)}
          className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          aria-label={`Remove time slot ${index + 1}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  </div>
)

interface RescheduleFormProps {
  loading: boolean
  suggestedTimes: SuggestedTime[]
  reason: string
  onTimesChange: (times: SuggestedTime[]) => void
  onReasonChange: (reason: string) => void
  onSubmit: () => void
  onCancel: () => void
}

const RescheduleForm: React.FC<RescheduleFormProps> = ({
  loading,
  suggestedTimes,
  reason,
  onTimesChange,
  onReasonChange,
  onSubmit,
  onCancel
}) => {
  const minDate = useMemo(() => getTodayDate(), [])
  
  const handleAddTime = useCallback(() => {
    onTimesChange([...suggestedTimes, { date: '', time: '' }])
  }, [suggestedTimes, onTimesChange])

  const handleRemoveTime = useCallback((index: number) => {
    onTimesChange(suggestedTimes.filter((_, i) => i !== index))
  }, [suggestedTimes, onTimesChange])

  const handleUpdateTime = useCallback((index: number, field: 'date' | 'time', value: string) => {
    const updated = [...suggestedTimes]
    updated[index][field] = value
    onTimesChange(updated)
  }, [suggestedTimes, onTimesChange])

  const isSubmitDisabled = useMemo(() => 
    loading || suggestedTimes.some(t => !t.date || !t.time),
    [loading, suggestedTimes]
  )

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Suggest Alternative Times</h2>
      <p className="text-gray-600 mb-6">
        Please provide at least one alternative time slot that works better for you.
      </p>
      
      <div className="space-y-4 mb-6">
        {suggestedTimes.map((time, index) => (
          <TimeSlotInput
            key={index}
            time={time}
            index={index}
            onUpdate={handleUpdateTime}
            onRemove={handleRemoveTime}
            canRemove={suggestedTimes.length > 1}
            minDate={minDate}
          />
        ))}
      </div>

      <button
        onClick={handleAddTime}
        className="mb-6 text-purple-600 hover:text-purple-700 font-medium flex items-center transition-colors"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Another Time Slot
      </button>

      <div className="mb-6">
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
          Reason (Optional)
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Please let us know why you need to reschedule..."
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// Main Component
function PanelistConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const token = searchParams.get('token')
  const action = searchParams.get('action')
  
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReschedule, setShowReschedule] = useState(false)
  const [suggestedTimes, setSuggestedTimes] = useState<SuggestedTime[]>([
    { date: '', time: '' }
  ])
  const [reason, setReason] = useState('')
  const [interviewDetails, setInterviewDetails] = useState<InterviewConfirmation | null>(null)

  const supabase: SupabaseClient = useMemo(() => createClientComponentClient(), [])

  const fetchInterviewDetails = useCallback(async () => {
    if (!token || typeof token !== 'string') return

    try {
      const { data, error: fetchError } = await supabase
        .from('interview_confirmations')
        .select(`
          id,
          interview_id,
          recipient_email,
          recipient_type,
          status,
          response_token,
          responded_at,
          interview_schedule!interview_confirmations_interview_id_fkey (
            candidate_email,
            interview_date,
            interview_time,
            duration_minutes,
            type,
            panelists,
            jobs!interview_schedule_job_id_fkey (
              title,
              school_info!jobs_school_id_fkey (
                name
              )
            ),
            job_applications!interview_schedule_candidate_id_fkey (
              candidate_name
            )
          )
        `)
        .eq('response_token', token)
        .single()

      if (fetchError) {
        console.error('Fetch error:', fetchError)
        throw fetchError
      }

      if (!data) {
        throw new Error('No interview confirmation found')
      }

      setInterviewDetails(data as unknown as InterviewConfirmation)
      
      if (data.status !== 'pending') {
        setError(`This interview has already been ${data.status}`)
      }
    } catch (err) {
      console.error('Error fetching interview details:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch interview details'
      setError(errorMessage)
    }
  }, [token, supabase])

  const handleConfirmation = useCallback(async (confirmAction: ConfirmAction) => {
    if (!token || typeof token !== 'string') return
    
    setLoading(true)
    setError(null)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration is missing')
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/handle-interview-confirmation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            token,
            action: confirmAction,
            suggested_times: confirmAction === 'reschedule' ? suggestedTimes : undefined,
            reason: confirmAction === 'decline' || confirmAction === 'reschedule' ? reason : undefined
          })
        }
      )

      const result: ConfirmationResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process confirmation')
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Confirmation error:', err)
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [token, suggestedTimes, reason])

  useEffect(() => {
    if (token) {
      fetchInterviewDetails()
    }
  }, [token, fetchInterviewDetails])

  useEffect(() => {
    if (action && token) {
      if (action === 'accept') {
        handleConfirmation('accept')
      } else if (action === 'decline') {
        setShowReschedule(false)
      } else if (action === 'reschedule') {
        setShowReschedule(true)
      }
    }
  }, [action, token, handleConfirmation])

  if (!token) {
    return <InvalidLinkScreen />
  }

  if (submitted) {
    return <SuccessScreen />
  }

  const isPending = interviewDetails?.status === 'pending'

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          {/* Replace /logo.png with your actual logo URL or remove if not available */}
          {/* <img src="/logo.png" alt="Hyriki" className="w-32 h-auto mx-auto mb-4" /> */}
          <div className="w-32 h-12 mx-auto mb-4 flex items-center justify-center">
            <h2 className="text-2xl font-bold text-purple-600">Hyriki</h2>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Interview Panel Request</h1>
          <p className="text-gray-600 mt-2">You have been invited to participate as an interview panelist</p>
        </div>

        {interviewDetails && (
          <InterviewDetailsCard confirmation={interviewDetails} />
        )}

        {error && <ErrorAlert message={error} />}

        {!showReschedule && isPending && (
          <ActionButtons
            loading={loading}
            onAccept={() => handleConfirmation('accept')}
            onReschedule={() => setShowReschedule(true)}
            onDecline={() => handleConfirmation('decline')}
          />
        )}

        {showReschedule && (
          <RescheduleForm
            loading={loading}
            suggestedTimes={suggestedTimes}
            reason={reason}
            onTimesChange={setSuggestedTimes}
            onReasonChange={setReason}
            onSubmit={() => handleConfirmation('reschedule')}
            onCancel={() => setShowReschedule(false)}
          />
        )}
      </div>
    </div>
  )
}

export default function PanelistConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <PanelistConfirmationContent />
    </Suspense>
  )
}