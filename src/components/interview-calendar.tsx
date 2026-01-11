'use client'

import React, { useState } from 'react'

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
  meeting_link?: string
  interviewers?: Array<{ name: string; avatar: string }>
  notes?: string
}

const mockInterviews: InterviewSchedule[] = [
  {
    id: '1',
    first_name: 'Sarah',
    last_name: 'Johnson',
    candidate_email: 'sarah.j@email.com',
    job_title: 'Senior Software Engineer',
    interview_date: '2026-01-13',
    start_time: '10:00',
    status: 'scheduled',
    interview_type: 'technical',
    candidate_response: 'accepted',
    interviewer_response: 'accepted',
    meeting_link: 'https://meet.example.com/interview-123',
    interviewers: [
      { name: 'Ahmad Zainy', avatar: 'AZ' },
      { name: 'Lydia Workman', avatar: 'LW' }
    ],
    notes: 'Don\'t forget to record key feedback during the session for evaluation.'
  },
  {
    id: '2',
    first_name: 'Michael',
    last_name: 'Chen',
    candidate_email: 'mchen@email.com',
    job_title: 'Product Manager',
    interview_date: '2026-01-13',
    start_time: '14:00',
    status: 'scheduled',
    interview_type: 'behavioral',
    candidate_response: 'accepted',
    interviewer_response: 'pending',
    meeting_link: 'https://meet.example.com/interview-456',
    interviewers: [
      { name: 'John Smith', avatar: 'JS' }
    ],
    notes: 'Focus on leadership experience and team management skills.'
  },
  {
    id: '3',
    first_name: 'Emily',
    last_name: 'Rodriguez',
    candidate_email: 'emily.r@email.com',
    job_title: 'UX Designer',
    interview_date: '2026-01-15',
    start_time: '11:00',
    status: 'scheduled',
    interview_type: 'portfolio',
    candidate_response: 'pending',
    interviewer_response: 'accepted',
    meeting_link: 'https://meet.example.com/interview-789',
    interviewers: [
      { name: 'Sarah Design', avatar: 'SD' }
    ],
    notes: 'Review portfolio beforehand. Prepare design challenge.'
  },
  {
    id: '4',
    first_name: 'David',
    last_name: 'Park',
    candidate_email: 'dpark@email.com',
    job_title: 'Data Scientist',
    interview_date: '2026-01-09',
    start_time: '09:00',
    status: 'completed',
    interview_type: 'technical',
    candidate_response: 'accepted',
    interviewer_response: 'accepted',
    meeting_link: 'https://meet.example.com/interview-111',
    interviewers: [
      { name: 'Dr. Analytics', avatar: 'DA' }
    ]
  },
  {
    id: '5',
    first_name: 'Jessica',
    last_name: 'Williams',
    candidate_email: 'jwilliams@email.com',
    job_title: 'Marketing Director',
    interview_date: '2026-01-17',
    start_time: '15:30',
    status: 'scheduled',
    interview_type: 'final',
    candidate_response: 'accepted',
    interviewer_response: 'accepted',
    meeting_link: 'https://meet.example.com/interview-222',
    interviewers: [
      { name: 'CEO Mark', avatar: 'CM' },
      { name: 'VP Marketing', avatar: 'VM' }
    ],
    notes: 'Final round with executive team. Discuss compensation.'
  },
  {
    id: '6',
    first_name: 'Alex',
    last_name: 'Thompson',
    candidate_email: 'athompson@email.com',
    job_title: 'Backend Engineer',
    interview_date: '2026-01-20',
    start_time: '13:00',
    status: 'scheduled',
    interview_type: 'technical',
    candidate_response: 'accepted',
    interviewer_response: 'accepted',
    meeting_link: 'https://meet.example.com/interview-333',
    interviewers: [
      { name: 'Tech Lead', avatar: 'TL' }
    ]
  }
]

const formatDate = (date: Date, formatStr: string) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  
  if (formatStr === 'MMMM yyyy') return `${months[date.getMonth()]} ${date.getFullYear()}`
  if (formatStr === 'd') return date.getDate().toString()
  return date.toDateString()
}

const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []
  
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  
  return { days, firstDay }
}

const isSameDay = (d1: Date, d2: Date) => 
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate()

const isToday = (date: Date) => isSameDay(date, new Date())

const formatTimeRange = (time: string) => {
  const [h, m] = time.split(':')
  return `${h}:${m} - ${(Number(h) + 1).toString().padStart(2, '0')}:${m}`
}

const formatTime = (time: string) => {
  const [h, m] = time.split(':')
  const hour = Number(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${m} ${ampm}`
}

const InterviewCard = ({ interview }: { interview: InterviewSchedule }) => {
  const [showPopover, setShowPopover] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 })

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPopoverPosition({ x: rect.left, y: rect.bottom + 8 })
    setShowPopover(true)
  }

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowPopover(false)}
        className="text-xs p-1.5 rounded bg-purple-50 border-l-2 border-purple-500 cursor-pointer hover:bg-purple-100 transition-colors"
      >
        <div className="font-medium text-gray-900 truncate">
          {interview.first_name} {interview.last_name}
        </div>
        <div className="text-gray-600 truncate">{formatTimeRange(interview.start_time)}</div>
      </div>

      {showPopover && (
        <div
          className="fixed z-50 w-96 bg-white rounded-lg shadow-2xl border border-gray-200"
          style={{
            left: `${popoverPosition.x}px`,
            top: `${popoverPosition.y}px`,
          }}
          onMouseEnter={() => setShowPopover(true)}
          onMouseLeave={() => setShowPopover(false)}
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">INTERVIEW</div>
                <div className="text-xl font-semibold text-gray-900 mb-1">
                  {formatTime(interview.start_time)} - {formatTime(`${Number(interview.start_time.split(':')[0]) + 1}:00`)}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                      {interview.first_name[0]}{interview.last_name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{interview.first_name} {interview.last_name}</div>
                      <div className="text-xs text-gray-500">Candidate</div>
                    </div>
                  </div>
                  {interview.interviewers?.map((interviewer, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
                        {interviewer.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{interviewer.name}</div>
                        <div className="text-xs text-gray-500">Interviewer</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {interview.meeting_link && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <a href={interview.meeting_link} className="text-sm text-blue-600 hover:text-blue-700 truncate block">
                      {interview.meeting_link}
                    </a>
                    <button className="text-xs text-gray-500 hover:text-gray-700 mt-1">
                      Copy link
                    </button>
                  </div>
                </div>
              )}

              {interview.notes && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-700 flex-1">{interview.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                View On Interview
              </button>
              <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
                Start Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function InterviewSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [interviews] = useState<InterviewSchedule[]>(mockInterviews)

  const { days, firstDay } = getDaysInMonth(currentDate)

  const getInterviewsForDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    return interviews.filter(interview => interview.interview_date === dateString)
  }

  const upcomingInterviews = interviews
    .filter(i => new Date(i.interview_date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime())
    .slice(0, 8)

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  return (
    <div className="h-full flex bg-gray-50">
      <div className="flex-1 bg-white p-8 overflow-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">
            {formatDate(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex gap-2 text-sm">
              <button className="px-3 py-1.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                All
              </button>
              <button className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
                Interview
              </button>
              <button className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
                Task
              </button>
            </div>
            <div className="flex gap-1">
              <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
              <div key={day} className="px-4 py-3 text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-32 bg-gray-50 border-r border-b border-gray-200"></div>
            ))}
            
            {days.map(day => {
              const dayInterviews = getInterviewsForDate(day)
              const isTodayDate = isToday(day)

              return (
                <div
                  key={day.toISOString()}
                  className="min-h-32 p-2 border-r border-b border-gray-200 hover:bg-gray-50 relative bg-white"
                >
                  <div className={`
                    text-sm font-semibold mb-2
                    ${isTodayDate ? 'inline-flex w-7 h-7 items-center justify-center bg-blue-600 text-white rounded-full' : 'text-gray-700'}
                  `}>
                    {formatDate(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayInterviews.map(interview => (
                      <InterviewCard key={interview.id} interview={interview} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Upcoming Interviews</h3>
        </div>
        
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {upcomingInterviews.map(interview => {
            const statusColors = {
              scheduled: 'border-l-blue-500',
              completed: 'border-l-green-500',
              overdue: 'border-l-red-500'
            }

            return (
              <div key={interview.id} className={`p-4 bg-white border border-gray-200 border-l-4 ${statusColors[interview.status]} rounded-lg hover:shadow-sm transition-shadow`}>
                <div className="font-medium text-gray-900 text-sm mb-1">
                  {interview.job_title}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <span>{interview.first_name} {interview.last_name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatTimeRange(interview.start_time)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}