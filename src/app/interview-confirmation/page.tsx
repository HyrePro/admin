// pages/interview-confirmation.tsx (for admin.hyriki.com)
'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface SuggestedTime {
  date: string
  time: string
}

interface Panelist {
  name: string
  email: string
}

interface JobApplication {
  candidate_name: string
}

interface School {
  name: string
}

interface Job {
  title: string
  schools: School
}

interface InterviewSchedule {
  candidate_email: string
  interview_date: string
  interview_time: string
  duration_minutes: number
  type: string
  panelists: Panelist[]
  jobs: Job
  job_applications: JobApplication[]
}

interface InterviewConfirmation {
  response_token: string
  status: string
  recipient_email: string
  interview_schedule: InterviewSchedule
}

export default function PanelistConfirmationPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [action, setAction] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReschedule, setShowReschedule] = useState(false)
  const [suggestedTimes, setSuggestedTimes] = useState<SuggestedTime[]>([
    { date: '', time: '' }
  ])
  const [reason, setReason] = useState('')
  const [interviewDetails, setInterviewDetails] = useState<InterviewConfirmation | null>(null)

  useEffect(() => {
    // Get query parameters from router
    const searchParams = new URLSearchParams(window.location.search)
    const tokenParam = searchParams.get('token')
    const actionParam = searchParams.get('action')
    
    setToken(tokenParam)
    setAction(actionParam)
  }, [])

  useEffect(() => {
    if (token) {
      fetchInterviewDetails()
    }
  }, [token])

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
  }, [action, token])

  const fetchInterviewDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_confirmations')
        .select(`
          *,
          interview_schedule:interview_id (
            candidate_email,
            interview_date,
            interview_time,
            duration_minutes,
            type,
            panelists,
            jobs (
              title,
              schools (name)
            ),
            job_applications (
              candidate_name
            )
          )
        `)
        .eq('response_token', token)
        .single()

      if (error) throw error
      setInterviewDetails(data)
      
      if (data.status !== 'pending') {
        setError(`This interview has already been ${data.status}`)
      }
    } catch (err: unknown) {
      setError((err as Error).message)
    }
  }

  const handleConfirmation = async (confirmAction: 'accept' | 'decline' | 'reschedule') => {
    if (!token) return
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/handle-interview-confirmation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            token,
            action: confirmAction,
            suggested_times: confirmAction === 'reschedule' ? suggestedTimes : undefined,
            reason: confirmAction === 'decline' || confirmAction === 'reschedule' ? reason : undefined
          })
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process confirmation')
      }

      setSubmitted(true)
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const addSuggestedTime = () => {
    setSuggestedTimes([...suggestedTimes, { date: '', time: '' }])
  }

  const removeSuggestedTime = (index: number) => {
    setSuggestedTimes(suggestedTimes.filter((_, i) => i !== index))
  }

  const updateSuggestedTime = (index: number, field: 'date' | 'time', value: string) => {
    const updated = [...suggestedTimes]
    updated[index][field] = value
    setSuggestedTimes(updated)
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid Link</h1>
          <p className="mt-2 text-gray-600">Please check your email for the correct link.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
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
          <a
            href="https://admin.hyriki.com/dashboard"
            className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Hyriki" className="w-32 h-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Interview Panel Request</h1>
          <p className="text-gray-600 mt-2">You have been invited to participate as an interview panelist</p>
        </div>

        {/* Interview Details Card */}
        {interviewDetails && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border border-gray-100">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {interviewDetails.interview_schedule.jobs.title}
                </h2>
                <p className="text-gray-600 mt-1">
                  {interviewDetails.interview_schedule.jobs.schools.name}
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                Panelist
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Candidate
                  </div>
                  <p className="font-semibold text-gray-900">
                    {interviewDetails.interview_schedule.job_applications?.[0]?.candidate_name || 
                     interviewDetails.interview_schedule.candidate_email}
                  </p>
                </div>

                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Interview Date
                  </div>
                  <p className="font-semibold text-gray-900">
                    {new Date(interviewDetails.interview_schedule.interview_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Time
                  </div>
                  <p className="font-semibold text-gray-900">
                    {interviewDetails.interview_schedule.interview_time}
                  </p>
                </div>

                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Duration & Type
                  </div>
                  <p className="font-semibold text-gray-900">
                    {interviewDetails.interview_schedule.duration_minutes} minutes • {' '}
                    {interviewDetails.interview_schedule.type === 'online' ? 'Online (Google Meet)' : 'In-person'}
                  </p>
                </div>
              </div>
            </div>

            {/* Other Panelists */}
            {interviewDetails.interview_schedule.panelists && 
             interviewDetails.interview_schedule.panelists.length > 1 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Other Panel Members</h3>
                <div className="flex flex-wrap gap-2">
                  {interviewDetails.interview_schedule.panelists
                    .filter((p: Panelist) => p.email !== interviewDetails.recipient_email)
                    .map((panelist: Panelist, index: number) => (
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
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!showReschedule && interviewDetails?.status === 'pending' && (
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              Please Confirm Your Availability
            </h2>
            
            <button
              onClick={() => handleConfirmation('accept')}
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Accept Panel Request
            </button>

            <button
              onClick={() => setShowReschedule(true)}
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Suggest Alternative Time
            </button>

            <button
              onClick={() => handleConfirmation('decline')}
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Decline Panel Request
            </button>
          </div>
        )}

        {/* Reschedule Form */}
        {showReschedule && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Suggest Alternative Times</h2>
            <p className="text-gray-600 mb-6">
              Please provide at least one alternative time slot that works better for you.
            </p>
            
            <div className="space-y-4 mb-6">
              {suggestedTimes.map((time, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex gap-3 items-start">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={time.date}
                        onChange={(e) => updateSuggestedTime(index, 'date', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                      <input
                        type="time"
                        value={time.time}
                        onChange={(e) => updateSuggestedTime(index, 'time', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    {suggestedTimes.length > 1 && (
                      <button
                        onClick={() => removeSuggestedTime(index)}
                        className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addSuggestedTime}
              className="mb-6 text-purple-600 hover:text-purple-700 font-medium flex items-center transition-colors"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Another Time Slot
            </button>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Please let us know why you need to reschedule..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleConfirmation('reschedule')}
                disabled={loading || suggestedTimes.some(t => !t.date || !t.time)}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                onClick={() => setShowReschedule(false)}
                disabled={loading}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}