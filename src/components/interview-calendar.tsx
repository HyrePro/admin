'use client'

import React, { useEffect, useState } from 'react'
import { getInterviewSchedule } from '@/lib/supabase/api/get-interview-schedule'
import { useAuthStore } from '@/store/auth-store'
import { createClient } from '@/lib/supabase/api/client'
import { format } from 'date-fns'

type ResponseState = 'accepted' | 'declined' | 'pending'

interface InterviewSchedule {
  id: string
  first_name: string
  last_name: string
  candidate_email?: string
  job_title: string

  interview_date: string
  start_time: string
  duration?: string

  status: 'scheduled' | 'completed' | 'overdue'
  interview_type: string

  candidate_response?: ResponseState
  interviewer_response?: ResponseState
}

const ResponseBadge = ({ state = 'pending' }: { state?: ResponseState }) => {
  const map = {
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    declined: 'bg-red-50 text-red-700 border-red-200',
    pending: 'bg-slate-50 text-slate-600 border-slate-200',
  }

  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-medium border rounded ${map[state]}`}>
      {state.toUpperCase()}
    </span>
  )
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold border rounded ${map[status]}`}>
      {status.toUpperCase()}
    </span>
  )
}

const StatusIndicator = ({ status }: { status: string }) => {
  const colorMap: Record<string, string> = {
    scheduled: 'bg-indigo-500',
    completed: 'bg-emerald-500',
    overdue: 'bg-red-500',
  }

  return (
    <div className={`w-1 h-full rounded-l ${colorMap[status] || 'bg-red-300'}`}></div>
  )
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })

const formatTimeRange = (time: string) => {
  const [h, m] = time.split(':')
  const start = new Date()
  start.setHours(Number(h), Number(m))
  const end = new Date(start)
  end.setHours(start.getHours() + 1)

  const f = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return `${f(start)} – ${f(end)}`
}

const formatDateTime = (dateString: string, timeString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  const date = new Date(year, month - 1, day, hours, minutes);
  return date;
};

const formatDateHeader = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return format(date, 'EEEE, MMMM d, yyyy'); // e.g., "Monday, January 1, 2023"
};

export default function InterviewScheduleList() {
  const { schoolId, user } = useAuthStore()
  const [interviews, setInterviews] = useState<InterviewSchedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!schoolId) return

    const fetchData = async () => {
      setLoading(true)
      const today = new Date()
      const start = new Date(today)
      start.setDate(today.getDate() - 30)
      const end = new Date(today)
      end.setDate(today.getDate() + 60)

      const res = await getInterviewSchedule(
        schoolId,
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0],
        1,
        user?.id,
        null
      )

      if (res?.data) setInterviews(res.data as unknown as InterviewSchedule[])
      setLoading(false)
    }

    fetchData()

    const supabase = createClient()
    const channel = supabase
      .channel('interview_schedule_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interview_schedule',
          filter: `school_id=eq.${schoolId}`,
        },
        fetchData
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [schoolId, user?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-500">
        Loading interviews…
      </div>
    )
  }

  // Group interviews by date
  const groupedInterviews = interviews.reduce((acc, interview) => {
    if (!acc[interview.interview_date]) {
      acc[interview.interview_date] = [];
    }
    acc[interview.interview_date].push(interview);
    return acc;
  }, {} as Record<string, InterviewSchedule[]>);

  // Sort dates chronologically
  const sortedDates = Object.keys(groupedInterviews).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="h-[600px] overflow-y-auto px-4">
      <div className="space-y-3">
        {sortedDates.map((date) => {
          const interviewsForDate = groupedInterviews[date];
          return (
            <div key={date} className="space-y-3">
              <div className="flex flex-col lg:flex-row">
                {/* Date Header Column with Enhanced Calendar-like Appearance */}
               {/* Date Column */}
<div className="relative lg:w-[110px] flex justify-center">
    {/* Vertical Line spans ONLY this date group */}
    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-slate-300" />

    {/* Sticky Date Card — stops at end of this column */}
    <div className="sticky top-0 self-start z-10">
     <div className="w-[88px] rounded-xl overflow-hidden border  bg-white">
    
    {/* Month header */}
    <div className="bg-slate-100 text-center py-1 border-b border-slate-300">
      <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
        {format(new Date(date), 'MMM')}
      </span>
    </div>

    {/* Day number */}
    <div className="flex flex-col items-center justify-center py-3">
      <span className="text-3xl font-bold text-slate-900 leading-none">
        {format(new Date(date), 'd')}
      </span>
      <span className="mt-1 text-[11px] font-medium text-slate-600 uppercase tracking-wide">
        {format(new Date(date), 'EEE')}
      </span>
    </div>

  </div>
    </div>
  </div>

                
                {/* Gap between columns */}
                <div className="hidden lg:block lg:w-4"></div>
                
                {/* Interviews Column */}
                <div className="flex-1 lg:pl-4">
                  <div className="space-y-3">
                  {/* Interviews for this date */}
                  {interviewsForDate.map((interview) => (
                    <div key={interview.id} className="flex bg-white border border-slate-200 rounded-lg mb-3 overflow-hidden">
                      <StatusIndicator status={interview.status} />
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_120px] flex-1">

                        {/* MAIN */}
                        <div className="p-4 sm:p-5 space-y-4">

                          <div className="flex flex-wrap items-center gap-3">
                            <StatusBadge status={interview.status} />
                            <span className="text-sm font-semibold text-slate-900">
                              {formatTimeRange(interview.start_time)}
                            </span>
                            <span className="lg:hidden text-sm text-slate-500">
                              {formatDate(interview.interview_date)}
                            </span>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-slate-500">Candidate</p>
                              <p className="text-sm font-medium text-slate-900">
                                {interview.first_name} {interview.last_name}
                              </p>
                              <p className="text-xs text-slate-600 truncate">
                                {interview.candidate_email}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-500">Applied Position</p>
                              <p className="text-sm font-medium text-slate-900">
                                {interview.job_title}
                              </p>
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-slate-500">Candidate Response</p>
                              <ResponseBadge state={interview.candidate_response} />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Interviewer Response</p>
                              <ResponseBadge state={interview.interviewer_response} />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            {interview.status === 'scheduled' && (
                              <button className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700">
                                Start Meeting
                              </button>
                            )}
                            {interview.status === 'completed' && (
                              <button className="px-4 py-2 text-sm font-medium border rounded hover:bg-slate-50">
                                View Recording
                              </button>
                            )}
                            {interview.status === 'overdue' && (
                              <button className="px-4 py-2 text-sm font-medium border border-red-300 text-red-700 rounded hover:bg-red-50">
                                Reschedule
                              </button>
                            )}
                          </div>
                        </div>

                       

                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
