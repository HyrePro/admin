'use client'

import React, { useState, useEffect, useRef } from 'react'

type ResponseState = 'accepted' | 'declined' | 'pending'
type ViewMode = 'month' | 'week' | 'day'

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

export const mockInterviews: InterviewSchedule[] = [
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
    interviewer_response: 'accepted'
  }
]

/* ---------- constants ---------- */
const WORKING_HOURS_VISIBLE = 8
const TIME_COLUMN_WIDTH = 64

/* ---------- helpers ---------- */
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const formatTime = (time: string) => {
  const [h, m] = time.split(':')
  const hour = Number(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${display}:${m} ${ampm}`
}

const formatTimeRange = (time: string) => {
  const [h, m] = time.split(':')
  return `${h}:${m} - ${(Number(h) + 1).toString().padStart(2, '0')}:${m}`
}

const formatDate = (date: Date, formatStr: string) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  if (formatStr === 'MMMM yyyy') return `${months[date.getMonth()]} ${date.getFullYear()}`
  if (formatStr === 'MMMM d, yyyy') return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  if (formatStr === 'd') return date.getDate().toString()
  if (formatStr === 'EEE') return shortDays[date.getDay()]
  if (formatStr === 'EEEE') return days[date.getDay()]
  return date.toDateString()
}

const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const days = []
  
  for (let d = 1; d <= new Date(year, month + 1, 0).getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  
  return { days, firstDay }
}

const getWeekDays = (date: Date) => {
  const curr = new Date(date)
  const first = curr.getDate() - curr.getDay()
  const days = []
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(curr)
    d.setDate(first + i)
    days.push(d)
  }
  
  return days
}



const InterviewPopover = ({ interview, position, onClose }: { interview: InterviewSchedule; position: { x: number; y: number }; onClose: () => void }) => {
  return (
    <div
      className="fixed z-50 w-96 bg-white rounded-lg shadow-2xl border border-gray-200"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseLeave={onClose}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">INTERVIEW</div>
            <div className="text-xl font-semibold text-gray-900 mb-1">
              {formatTime(interview.start_time)} - {formatTime(`${Number(interview.start_time.split(':')[0]) + 1}:00`)}
            </div>
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
              </svg>
              <div className="flex-1 min-w-0">
                <a href={interview.meeting_link} className="text-sm text-blue-600 hover:text-blue-700 truncate block">
                  {interview.meeting_link}
                </a>
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
          <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            View Details
          </button>
          <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800">
            Start Meeting
          </button>
        </div>
      </div>
    </div>
  )
}

const InterviewCard = ({ interview, compact = false }: { interview: InterviewSchedule; compact?: boolean }) => {
  const [showPopover, setShowPopover] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 })

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPopoverPosition({ x: rect.left, y: rect.bottom + 8 })
    setShowPopover(true)
  }

  if (compact) {
    return (
      <>
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setShowPopover(false)}
          className="text-xs p-1.5 rounded bg-purple-50 border-l-2 border-purple-500 cursor-pointer hover:bg-purple-100 transition-colors"
        >
          <div className="font-medium text-gray-900 truncate">{interview.first_name} {interview.last_name}</div>
          <div className="text-gray-600 truncate">{formatTimeRange(interview.start_time)}</div>
        </div>
        {showPopover && <InterviewPopover interview={interview} position={popoverPosition} onClose={() => setShowPopover(false)} />}
      </>
    )
  }

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowPopover(false)}
        className="p-3 rounded-lg bg-purple-50 border-l-4 border-purple-500 cursor-pointer hover:bg-purple-100 transition-colors"
      >
        <div className="text-sm font-medium text-gray-900 mb-1">{formatTime(interview.start_time)}</div>
        <div className="font-semibold text-gray-900 mb-1">{interview.first_name} {interview.last_name}</div>
        <div className="text-sm text-gray-600">{interview.job_title}</div>
      </div>
      {showPopover && <InterviewPopover interview={interview} position={popoverPosition} onClose={() => setShowPopover(false)} />}
    </>
  )
}

export default function InterviewSchedulePage({ interviews = mockInterviews }: { interviews?: InterviewSchedule[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [showViewDropdown, setShowViewDropdown] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  
  const weekDayContainerRef = useRef<HTMLDivElement>(null)
  const dayContainerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])
  
  useEffect(() => {
    if (viewMode !== 'month') {
      setTimeout(() => {
        scrollToCurrentTime()
      }, 100)
    }
  }, [viewMode, currentDate])
  
  const scrollToCurrentTime = () => {
    if (viewMode === 'month') return
    
    const containerRef = viewMode === 'week' ? weekDayContainerRef : dayContainerRef
    if (!containerRef.current) return
    
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    
    const hourPosition = currentHour + (currentMinute / 60)
    const pixelPosition = hourPosition * 80
    
    // Different offsets for week vs day view due to different layouts
    const offset = viewMode === 'week' ? 212 : 152 // Week view offset adjusted by -12, day view by +48 to match indicator positioning
    containerRef.current.scrollTop = pixelPosition - offset
  }
  
  const isTodayDate = (date: Date) => isSameDay(date, currentTime)
  const isToday = (date: Date) => isSameDay(date, currentTime)
  
  const getCurrentTimePosition = () => {
    if (viewMode === 'month') return null
    
    const now = currentTime
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    
    const hourPosition = currentHour + (currentMinute / 60)
    const pixelPosition = hourPosition * 80
    
    return pixelPosition
  }

  const { days, firstDay } = getDaysInMonth(currentDate)
  const weekDays = getWeekDays(currentDate)

  const getInterviewsForDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    return interviews.filter(i => i.interview_date === dateString)
  }

  const previousPeriod = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const nextPeriod = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const getHeaderText = () => {
    if (viewMode === 'month') return formatDate(currentDate, 'MMMM yyyy')
    if (viewMode === 'week') {
      const start = weekDays[0]
      const end = weekDays[6]
      return `${formatDate(start, 'MMMM d, yyyy')} - ${formatDate(end, 'MMMM d, yyyy')}`
    }
    return formatDate(currentDate, 'MMMM d, yyyy')
  }

  const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)

  return (
    <div className="h-full flex bg-gray-50">
      <div className="flex-1 bg-white px-4 py-2 overflow-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">{getHeaderText()}</h2>
          <div className="flex items-center gap-4">
           
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowViewDropdown(!showViewDropdown)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  {viewMode === 'month' ? 'Month' : viewMode === 'week' ? 'Week' : 'Day'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showViewDropdown && (
                  <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button onClick={() => { setViewMode('month'); setShowViewDropdown(false) }} className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 rounded-t-lg">Month</button>
                    <button onClick={() => { setViewMode('week'); setShowViewDropdown(false) }} className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50">Week</button>
                    <button onClick={() => { setViewMode('day'); setShowViewDropdown(false) }} className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 rounded-b-lg">Day</button>
                  </div>
                )}
              </div>
              <button onClick={previousPeriod} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={nextPeriod} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'month' && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="px-4 py-3 text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-32 bg-gray-50 border-r border-b border-gray-200"></div>
              ))}
              {days.map(day => {
                const dayInterviews = getInterviewsForDate(day)
                return (
                  <div key={day.toISOString()} className="min-h-32 p-2 border-r border-b border-gray-200 hover:bg-gray-50 bg-white">
                    <div className={`text-sm font-semibold mb-2 ${isToday(day) ? 'inline-flex w-7 h-7 items-center justify-center bg-blue-600 text-white rounded-full' : 'text-gray-700'}`}>
                      {formatDate(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayInterviews.map(interview => (
                        <InterviewCard key={interview.id} interview={interview} compact />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {viewMode === 'week' && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex bg-gray-50 border-b border-gray-200 sticky top-0 z-30">
              <div className="w-16 px-2 py-3 text-sm font-semibold text-gray-700 border-r flex-shrink-0">Time</div>
              <div className="flex-1 grid grid-cols-7">
                {weekDays.map(day => (
                  <div key={day.toISOString()} className="px-2 py-3 text-center border-r last:border-r-0">
                    <div className="text-xs text-gray-500">{formatDate(day, 'EEE')}</div>
                    <div className={`text-sm font-semibold mt-1 ${isToday(day) ? 'text-blue-600' : 'text-gray-700'}`}>{formatDate(day, 'd')}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="max-h-[600px] overflow-auto" ref={weekDayContainerRef}>
              <div className="relative">
                {getCurrentTimePosition() !== null && weekDays.some(day => isTodayDate(day)) && (
                  <>
                    <div 
                      className="absolute h-0.5 bg-red-500 z-20 pointer-events-none"
                      style={{ 
                        top: `${(getCurrentTimePosition() || 0) - 12}px`, // Adjusted for correct position
                        left: '4rem',
                        right: '0'
                      }}
                    >
                      <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full"></div>
                    </div>
                    <div 
                      className="absolute text-xs font-medium text-red-500 z-20 pointer-events-none whitespace-nowrap"
                      style={{ 
                        top: `${(getCurrentTimePosition() || 0) - 16}px`, // Adjusted for correct position
                        right: '0.5rem'
                      }}
                    >
                      {formatTime(`${Math.floor((getCurrentTimePosition() || 0) / 80).toString().padStart(2, '0')}:${Math.round((((getCurrentTimePosition() || 0) / 80) % 1) * 60).toString().padStart(2, '0')}`)}
                    </div>
                  </>
                )}
                {timeSlots.map(time => (
                  <div key={time} className="flex">
                    <div className="w-16 px-2 py-3 text-xs text-gray-500 border-r border-b bg-gray-50 flex-shrink-0">{time}</div>
                    <div className="flex-1 grid grid-cols-7">
                      {weekDays.map(day => {
                        const dayInterviews = getInterviewsForDate(day).filter(i => i.start_time.startsWith(time.split(':')[0]))
                        return (
                          <div key={`${day.toISOString()}-${time}`} className="p-2 border-r border-b bg-white min-h-[80px]">
                            {dayInterviews.map(interview => (
                              <InterviewCard key={interview.id} interview={interview} />
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'day' && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 border-b p-4 text-center sticky top-0 z-30">
              <div className="text-sm text-gray-500">{formatDate(currentDate, 'EEEE')}</div>
              <div className={`text-2xl font-semibold mt-1 ${isToday(currentDate) ? 'text-blue-600' : 'text-gray-900'}`}>{formatDate(currentDate, 'd')}</div>
            </div>
            <div className="max-h-[600px] overflow-auto" ref={dayContainerRef}>
              <div className="relative">
                {getCurrentTimePosition() !== null && isTodayDate(currentDate) && (
                  <>
                    <div 
                      className="absolute h-0.5 bg-red-500 z-20 pointer-events-none"
                      style={{ 
                        top: `${(getCurrentTimePosition() || 0) + 48}px`, // Adjusted for correct position
                        left: '6rem',
                        right: '0'
                      }}
                    >
                      <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full"></div>
                    </div>
                    <div 
                      className="absolute text-xs font-medium text-red-500 z-20 pointer-events-none whitespace-nowrap"
                      style={{ 
                        top: `${(getCurrentTimePosition() || 0) + 44}px`, // Adjusted for correct position
                        right: '0.5rem'
                      }}
                    >
                      {formatTime(`${Math.floor((getCurrentTimePosition() || 0) / 80).toString().padStart(2, '0')}:${Math.round((((getCurrentTimePosition() || 0) / 80) % 1) * 60).toString().padStart(2, '0')}`)}
                    </div>
                  </>
                )}
                {timeSlots.map(time => {
                  const timeInterviews = getInterviewsForDate(currentDate).filter(i => i.start_time.startsWith(time.split(':')[0]))
                  return (
                    <div key={time} className="flex border-b">
                      <div className="w-24 px-4 py-3 text-xs text-gray-500 border-r bg-gray-50 flex-shrink-0">{time}</div>
                      <div className="flex-1 p-3 bg-white min-h-[80px]">
                        <div className="space-y-2">
                          {timeInterviews.map(interview => (
                            <InterviewCard key={interview.id} interview={interview} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}