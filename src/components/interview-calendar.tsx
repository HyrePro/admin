'use client'
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Briefcase } from 'lucide-react';
import { getInterviewSchedule } from '@/lib/supabase/api/get-interview-schedule';
import { useAuthStore } from '@/store/auth-store';
import { createClient } from '@/lib/supabase/api/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InterviewSchedule {
  first_name: string;
  last_name: string;
  start_time: string;
  interview_date: string;
  created_by: string;
  panelists: Array<{
    id: string;
    name: string;
    email: string;
  }> | null;
  interview_type: string;
  status: string;
}

interface Interview {
  id: number;
  title: string;
  start: Date;
  end: Date;
  interviewer: string;
  position: string;
  type: string;
  color: string;
  created_by: string;
  is_online: boolean;
}

interface EventPosition {
  top: number;
  height: number;
}

// Add new interface for positioned events
interface PositionedEvent {
  event: Interview;
  position: EventPosition;
  left: number;
  width: number;
}

// The interviews state is now populated with real data from the API

const InterviewCalendar: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(today);
    monday.setDate(diff);
    return monday;
  });
  const [selectedEvent, setSelectedEvent] = useState<Interview | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<number>(1); // 1: All, 2: Organizer, 3: Panelist
  const userId = useAuthStore(state => state.user?.id);
  const [jobId, setJobId] = useState<string | null>(null);
  const { schoolId } = useAuthStore();

  const hours: number[] = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  const getWeekDays = (startDate: Date): Date[] => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays: Date[] = getWeekDays(currentWeekStart);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDayName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const getEventsForDay = (date: Date): Interview[] => {
    return interviews.filter(event => isSameDay(event.start, date));
  };

  const getEventPosition = (event: Interview): EventPosition => {
    const startHour = event.start.getHours();
    const startMinute = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinute = event.end.getMinutes();

    const top = ((startHour - 8) * 60 + startMinute); // 60px per hour
    const duration = ((endHour - startHour) * 60 + (endMinute - startMinute));
    const height = Math.max(40, duration); // Minimum height of 40px

    return { top, height };
  };

  // New function to detect and position overlapping events
  const getPositionedEventsForDay = (date: Date): PositionedEvent[] => {
    const dayEvents = interviews.filter(event => isSameDay(event.start, date));
    
    // Sort events by start time
    dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Track which events have been processed
    const processed = new Set<number>();
    const positionedEvents: PositionedEvent[] = [];
    
    // Process events and handle overlaps
    dayEvents.forEach(event => {
      // Skip if already processed
      if (processed.has(event.id)) return;
      
      // Find all overlapping events
      const overlappingGroup: Interview[] = [event];
      
      dayEvents.forEach(otherEvent => {
        if (event.id === otherEvent.id) return;
        if (processed.has(otherEvent.id)) return;
        
        // Check if events overlap in time
        if (event.start < otherEvent.end && event.end > otherEvent.start) {
          overlappingGroup.push(otherEvent);
        }
      });
      
      // Mark all events in group as processed
      overlappingGroup.forEach(e => processed.add(e.id));
      
      // Calculate positions
      const widthPerEvent = 100 / overlappingGroup.length;
      
      overlappingGroup.forEach((e, index) => {
        positionedEvents.push({
          event: e,
          position: getEventPosition(e),
          left: index * widthPerEvent,
          width: widthPerEvent
        });
      });
    });
    
    return positionedEvents;
  };

  // Fetch interview data
  useEffect(() => {
    const fetchInterviews = async () => {
      if (!schoolId) return;
      
      setLoading(true);
      try {
        // Get start and end dates for the current week
        const startDate = weekDays[0].toISOString().split('T')[0];
        const endDate = weekDays[6].toISOString().split('T')[0];
        
        const response = await getInterviewSchedule(schoolId, startDate, endDate, filterType, userId, jobId);
        
        if (response.data) {
          // Convert the response data to Interview format
          const formattedInterviews: Interview[] = response.data.map((item, index) => {
            const interviewDate = new Date(`${item.interview_date}T${item.start_time}`);
            // Create a 1-hour duration interview
            const endTime = new Date(interviewDate);
            endTime.setHours(endTime.getHours() + 1);
            
            // Determine if meeting is online or offline based on interview type or other criteria
            // For now, we'll use a simple heuristic - you may need to adjust this based on your data
            const isOnline = item.interview_type.toLowerCase().includes('online') || 
                            item.interview_type.toLowerCase().includes('virtual') || 
                            item.interview_type.toLowerCase().includes('video');
            
            // Color coding logic:
            // 1. Online (#3b82f6)
            // 2. Offline (#8b5cf6)
            // 3. Created_By + Online (#ec4899)
            // 4. Created_By + Offline (#14b8a6)
            
            let color = '#3b82f6'; // Default to online color
            
            if (item.created_by === userId) {
              // User is the creator
              if (isOnline) {
                color = '#ec4899'; // Created_By + Online
              } else {
                color = '#14b8a6'; // Created_By + Offline
              }
            } else {
              // User is not the creator
              if (isOnline) {
                color = '#3b82f6'; // Online
              } else {
                color = '#8b5cf6'; // Offline
              }
            }
            
            return {
              id: index + 1,
              title: `${item.first_name} ${item.last_name}`,
              start: interviewDate,
              end: endTime,
              interviewer: item.panelists && item.panelists.length > 0 
                ? item.panelists[0].name 
                : 'Not Assigned',
              position: '', // Position data not available in current API
              type: item.interview_type,
              color: color,
              created_by: item.created_by,
              is_online: isOnline
            };
          });
          
          setInterviews(formattedInterviews);
        }
      } catch (error) {
        console.error('Error fetching interviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
    
    // Set up real-time listener for interview_schedule table
    if (schoolId) {
      const supabase = createClient();
      
      const channel = supabase
        .channel('interview_schedule_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'interview_schedule',
            filter: `school_id=eq.${schoolId}`
          },
          () => {
            // Refetch the interviews when there are changes
            fetchInterviews();
          }
        )
        .subscribe();
      
      // Clean up the subscription
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentWeekStart, schoolId, filterType, userId, jobId]);

  const nextWeek = (): void => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const prevWeek = (): void => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = (): void => {
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    setCurrentWeekStart(monday);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return isSameDay(date, today);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Calendar</h1>
            <p className="text-slate-600 mt-1">Week of {formatDate(weekDays[0])} - {formatDate(weekDays[6])}</p>
          </div>
          <div className="flex gap-3 items-center">
            <Select value={filterType.toString()} onValueChange={(value) => setFilterType(Number(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Meetings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">All Meetings</SelectItem>
                <SelectItem value="2">Organizer</SelectItem>
                <SelectItem value="3">Panelist</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
            >
              Today
            </button>
            <button
              onClick={prevWeek}
              className="p-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextWeek}
              className="p-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-lg flex flex-col flex-1 overflow-hidden">
        {/* Day Headers - Fixed */}
        <div className="grid grid-cols-8 border-b border-slate-200 flex-shrink-0">
          <div className="p-4 bg-slate-50"></div>
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className={`p-4 text-center border-l border-slate-200 ${
                isToday(day) ? 'bg-blue-50' : 'bg-slate-50'
              }`}
            >
              <div className="text-sm font-semibold text-slate-600">{getDayName(day)}</div>
              <div className={`text-2xl font-bold mt-1 ${
                isToday(day) ? 'text-blue-600' : 'text-slate-800'
              }`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time Grid - Scrollable */}
        <div className="grid grid-cols-8 flex-1 overflow-y-auto">
          {/* Time column */}
          <div className="bg-slate-100 border-r border-slate-200">
            {hours.map((hour) => (
              <div key={hour} className="h-16 border-b border-slate-200 pr-2 pt-1 text-right text-sm text-slate-700 font-medium">
                {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIdx) => (
            <div key={dayIdx} className={`relative border-l border-slate-200 ${isToday(day) ? 'bg-blue-50 bg-opacity-30' : ''}`}>
              {hours.map((hour) => (
                <div key={hour} className="h-16 border-b border-slate-200"></div>
              ))}

              {/* Events overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="relative h-full pointer-events-auto">
                  {getPositionedEventsForDay(day).map(({ event, position, left, width }) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="absolute rounded-lg p-2 cursor-pointer hover:opacity-80 transition overflow-hidden"
                      style={{
                        top: `${position.top}px`,
                        height: `${position.height}px`,
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: event.color,
                        minHeight: '40px',
                        marginLeft: '1%',
                        marginRight: '1%'
                      }}
                    >
                      <div className="text-white text-xs font-semibold truncate">
                        {event.title}
                      </div>
                      <div className="text-white text-xs opacity-90 truncate">
                        {formatTime(event.start)}
                      </div>
                      <div className="text-white text-xs opacity-80 truncate">
                        {event.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex top-100 left-100 z-50 ">
          <div className="bg-white p-4 rounded-lg shadow-lg h-12">
            <p>Loading interviews...</p>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-black-600 bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Interview Details</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-600 mt-0.5" />
                <div>
                  <label className="text-sm font-semibold text-slate-600">Candidate</label>
                  <p className="text-lg text-slate-800">{selectedEvent.title}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-slate-600 mt-0.5" />
                <div>
                  <label className="text-sm font-semibold text-slate-600">Position</label>
                  <p className="text-slate-800">{selectedEvent.position || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded mt-0.5" style={{ backgroundColor: selectedEvent.color }}></div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">Interview Type</label>
                  <p className="text-slate-800">{selectedEvent.type}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-600 mt-0.5" />
                <div>
                  <label className="text-sm font-semibold text-slate-600">Interviewer</label>
                  <p className="text-slate-800">{selectedEvent.interviewer}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-600 mt-0.5" />
                <div>
                  <label className="text-sm font-semibold text-slate-600">Time</label>
                  <p className="text-slate-800">
                    {selectedEvent.start.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-slate-800">
                    {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium transition">
                  Join Meeting
                </button>
                <button className="flex-1 bg-slate-200 text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-300 font-medium transition">
                  Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewCalendar;