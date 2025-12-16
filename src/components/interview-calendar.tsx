'use client'
import React, { useState, useEffect, useRef } from 'react';
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
  location?: string;
  job_title: string;
}

interface Interview {
  id: string | number; // Allow both string and number IDs
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
  console.log('Current interviews state:', interviews); // Add debug log
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<number>(1); // 1: All, 2: Organizer, 3: Panelist
  const userId = useAuthStore(state => state.user?.id);
  const [jobId, setJobId] = useState<string | null>(null);
  const { schoolId } = useAuthStore();
  
  // Add a ref to track if we're currently fetching
  const isFetching = useRef(false);

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
    const result = date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
    
    console.log(`Comparing dates: ${date1.toDateString()} === ${date2.toDateString()} = ${result}`);
    
    return result;
  };

  const getEventsForDay = (date: Date): Interview[] => {
    const filteredEvents = interviews.filter(event => isSameDay(event.start, date));
    console.log(`Filtered events for ${date.toDateString()}: ${filteredEvents.length} events`);
    return filteredEvents;
  };

  const getEventPosition = (event: Interview): EventPosition => {
    const startHour = event.start.getHours();
    const startMinute = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinute = event.end.getMinutes();

    // Each hour is represented by 64px (h-16 class = 4rem = 64px)
    const top = ((startHour - 8) * 64 + (startMinute / 60) * 64); // 64px per hour
    const duration = ((endHour - startHour) * 64 + ((endMinute - startMinute) / 60) * 64);
    const height = Math.max(40, duration); // Minimum height of 40px

    console.log(`Event ${event.title} position: top=${top}, height=${height}, startHour=${startHour}, startMinute=${startMinute}`);
    
    // Ensure events are within bounds
    const boundedTop = Math.max(0, top);
    const boundedHeight = height;
    
    return { top: boundedTop, height: boundedHeight };
  };

  // New function to detect and position overlapping events
  const getPositionedEventsForDay = (date: Date): PositionedEvent[] => {
    console.log(`getPositionedEventsForDay called for ${date.toDateString()}`); // Add debug log
    
    const dayEvents = interviews.filter(event => isSameDay(event.start, date));
    
    console.log(`Found ${dayEvents.length} events for ${date.toDateString()}`);
    
    // Sort events by start time
    dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Group overlapping events
    const groups: Interview[][] = [];
    const used = new Set<string | number>();
    
    dayEvents.forEach((event, index) => {
      // Create a unique key for the event
      const eventKey = typeof event.id === 'string' ? event.id : `${event.id}_${index}`;
      
      if (used.has(eventKey)) return;
      
      const group: Interview[] = [event];
      used.add(eventKey);
      
      dayEvents.forEach((otherEvent, otherIndex) => {
        // Create a unique key for the other event
        const otherEventKey = typeof otherEvent.id === 'string' ? otherEvent.id : `${otherEvent.id}_${otherIndex}`;
        
        if (used.has(otherEventKey)) return;
        if (index === otherIndex) return;
        
        // Check if events overlap in time
        if (event.start < otherEvent.end && event.end > otherEvent.start) {
          group.push(otherEvent);
          used.add(otherEventKey);
        }
      });
      
      groups.push(group);
    });
    
    // Position events within groups
    const positionedEvents: PositionedEvent[] = [];
    
    groups.forEach(group => {
      const widthPerEvent = 100 / group.length;
      
      group.forEach((event, index) => {
        const position = getEventPosition(event);
        console.log(`Positioning event ${event.title}: left=${index * widthPerEvent}%, width=${widthPerEvent}%`);
        
        positionedEvents.push({
          event: event,
          position: position,
          left: index * widthPerEvent,
          width: widthPerEvent
        });
      });
    });
    
    console.log(`Positioned ${positionedEvents.length} events for ${date.toDateString()}`);
    
    return positionedEvents;
  };

  // Fetch interview data
  useEffect(() => {
    console.log('useEffect triggered with dependencies:', { currentWeekStart, schoolId, filterType, userId, jobId }); // Add debug log
    
    const fetchInterviews = async () => {
      // Prevent multiple simultaneous fetches
      if (isFetching.current) {
        console.log('Fetch already in progress, skipping...');
        return;
      }
      
      console.log('Fetching interviews...'); // Add debug log
      isFetching.current = true;
      
      if (!schoolId) {
        isFetching.current = false;
        return;
      }
      
      setLoading(true);
      try {
        // Get start and end dates for the current week
        const startDate = weekDays[0].toISOString().split('T')[0];
        const endDate = weekDays[6].toISOString().split('T')[0];
        
        const response = await getInterviewSchedule(schoolId, startDate, endDate, filterType, userId, jobId);
        
        if (response.data) {
          // Log the raw response data for debugging
          console.log('Raw interview data:', response.data);
          
          // Convert the response data to Interview format
          const formattedInterviews: Interview[] = response.data.map((item, index) => {
            const interviewDate = new Date(`${item.interview_date}T${item.start_time}`);
            // Create a 1-hour duration interview (or use duration from API if available)
            const endTime = new Date(interviewDate);
            endTime.setHours(endTime.getHours() + 1);
            
            // Determine if meeting is online or offline based on interview type or other criteria
            // For now, we'll use a simple heuristic - you may need to adjust this based on your data
            const isOnline = item.interview_type.toLowerCase().includes('online') || 
                            item.interview_type.toLowerCase().includes('virtual') || 
                            item.interview_type.toLowerCase().includes('video');
            
            // Log for debugging purposes
            console.log(`Interview ${item.first_name} ${item.last_name}: Type=${item.interview_type}, Online=${isOnline}`);
            
            // Color coding logic with proper text contrast:
            // 1. Online (#3b82f6) - blue
            // 2. Offline (#8b5cf6) - purple
            // 3. Created_By + Online (#ec4899) - pink
            // 4. Created_By + Offline (#14b8a6) - teal
            
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
            
            // Extract job title if available
            const jobTitle = item.job_title || '';
            
            // Create a unique ID for the event using more unique properties
            const uniqueId = `${item.first_name}_${item.last_name}_${item.interview_date}_${item.start_time}_${item.created_by}`;
            
            // Log the formatted interview for debugging
            console.log('Formatted interview:', {
              id: uniqueId,
              title: `${item.first_name} ${item.last_name}`,
              start: interviewDate,
              end: endTime,
              interviewer: item.panelists && item.panelists.length > 0 
                ? item.panelists[0].name 
                : 'Not Assigned',
              position: jobTitle, // Use job title as position
              type: item.interview_type,
              color: color,
              created_by: item.created_by,
              is_online: isOnline,
            });
            
            return {
              id: uniqueId, // Use a more unique ID
              title: `${item.first_name} ${item.last_name}`,
              start: interviewDate,
              end: endTime,
              interviewer: item.panelists && item.panelists.length > 0 
                ? item.panelists[0].name 
                : 'Not Assigned',
              position: jobTitle, // Use job title as position
              type: item.interview_type,
              color: color,
              created_by: item.created_by,
              is_online: isOnline,
              // location field not available in API
            };
          });
          
          // Deduplicate events based on ID
          const uniqueInterviews = formattedInterviews.filter((interview, index, self) => 
            index === self.findIndex(i => i.id === interview.id)
          );
          
          // Log the formatted interviews for debugging
          console.log('Formatted interviews:', formattedInterviews);
          console.log('Unique interviews after deduplication:', uniqueInterviews);
          console.log(`Setting ${uniqueInterviews.length} unique interviews in state`); // Add debug log
          
          setInterviews(uniqueInterviews);
        }
      } catch (error) {
        console.error('Error fetching interviews:', error);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    };

    fetchInterviews();
    
    // Set up real-time listener for interview_schedule table
    if (schoolId) {
      console.log('Setting up real-time listener for schoolId:', schoolId); // Add debug log
      
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
            console.log('Real-time listener triggered, refetching interviews...'); // Add debug log
            fetchInterviews();
          }
        )
        .subscribe();
      
      // Clean up the subscription
      return () => {
        console.log('Cleaning up real-time listener'); // Add debug log
        isFetching.current = false; // Reset the fetching flag
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
                  {
                    (() => {
                      const positionedEvents = getPositionedEventsForDay(day);
                      return positionedEvents.length > 0 ? (
                        positionedEvents.map(({ event, position, left, width }) => {
                          // Add a check to ensure event data is valid
                          if (!event.title || !event.start) {
                            console.warn('Invalid event data:', event);
                            return null;
                          }
                          
                          console.log(`Rendering event: ${event.title} at position top=${position.top}, height=${position.height}, left=${left}%, width=${width}%`);
                          
                          return (
                            <div
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className="absolute rounded-lg p-2 cursor-pointer hover:opacity-80 transition overflow-hidden flex flex-col border-2 border-white"
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
                              <div className="text-white text-xs font-semibold truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                                {event.title}
                              </div>
                              <div className="text-white text-xs opacity-90 truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                                {formatTime(event.start)}
                              </div>
                              <div className="text-white text-xs mt-1 truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs ${event.is_online ? 'bg-green-500' : 'bg-orange-500'}`}>
                                  {event.is_online ? (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                        <polyline points="17 6 23 6 23 12"></polyline>
                                      </svg>
                                      Online
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                      </svg>
                                      Offline
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : null;
                    })()
                  }
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
                  {selectedEvent.position && (
                    <p className="text-sm text-slate-600 mt-1">{selectedEvent.position}</p>
                  )}
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
                  <p className="text-slate-800">
                    {selectedEvent.type} ({selectedEvent.is_online ? 'Online' : 'Offline'})
                  </p>
                </div>
              </div>

              {!selectedEvent.is_online && (
                <div className="flex items-start gap-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="text-yellow-600 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-yellow-800">Offline Interview</label>
                    <p className="text-sm text-yellow-700">This is an in-person interview. Please coordinate location details with the interviewer.</p>
                  </div>
                </div>
              )}

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
                {selectedEvent.is_online ? (
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium transition">
                    Join Meeting
                  </button>
                ) : (
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium transition">
                    View Location
                  </button>
                )}
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