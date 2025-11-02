'use client'
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Briefcase } from 'lucide-react';

interface Interview {
  id: number;
  title: string;
  start: Date;
  end: Date;
  interviewer: string;
  position: string;
  type: string;
  color: string;
}

interface EventPosition {
  top: number;
  height: number;
}

// Sample interview data
const sampleInterviews: Interview[] = [
  {
    id: 1,
    title: 'John Smith',
    start: new Date(2025, 9, 28, 10, 0),
    end: new Date(2025, 9, 28, 11, 0),
    interviewer: 'Sarah Johnson',
    position: 'Senior Frontend Developer',
    type: 'Technical Round',
    color: '#3b82f6'
  },
  {
    id: 2,
    title: 'Emily Davis',
    start: new Date(2025, 9, 28, 14, 0),
    end: new Date(2025, 9, 28, 15, 30),
    interviewer: 'Michael Chen',
    position: 'Backend Developer',
    type: 'Technical Round',
    color: '#3b82f6'
  },
  {
    id: 3,
    title: 'Alex Wong',
    start: new Date(2025, 9, 29, 9, 0),
    end: new Date(2025, 9, 29, 10, 0),
    interviewer: 'Jennifer Lee',
    position: 'Senior Product Manager',
    type: 'Behavioral Round',
    color: '#8b5cf6'
  },
  {
    id: 4,
    title: 'Maria Garcia',
    start: new Date(2025, 9, 29, 15, 0),
    end: new Date(2025, 9, 29, 16, 30),
    interviewer: 'David Park',
    position: 'UI/UX Designer',
    type: 'Portfolio Review',
    color: '#ec4899'
  },
  {
    id: 5,
    title: 'Robert Taylor',
    start: new Date(2025, 9, 30, 11, 0),
    end: new Date(2025, 9, 30, 12, 30),
    interviewer: 'Lisa Anderson',
    position: 'Senior Data Scientist',
    type: 'Technical Round',
    color: '#3b82f6'
  },
  {
    id: 6,
    title: 'James Wilson',
    start: new Date(2025, 9, 31, 10, 30),
    end: new Date(2025, 9, 31, 11, 30),
    interviewer: 'Tom Martinez',
    position: 'DevOps Engineer',
    type: 'System Design',
    color: '#14b8a6'
  },
  {
    id: 7,
    title: 'Sophie Brown',
    start: new Date(2025, 9, 31, 14, 0),
    end: new Date(2025, 9, 31, 15, 0),
    interviewer: 'Rachel Kim',
    position: 'Marketing Manager',
    type: 'Final Round',
    color: '#f59e0b'
  },
  {
    id: 8,
    title: 'Chris Johnson',
    start: new Date(2025, 10, 1, 9, 30),
    end: new Date(2025, 10, 1, 11, 0),
    interviewer: 'Sarah Johnson',
    position: 'Full Stack Developer',
    type: 'Coding Challenge',
    color: '#10b981'
  }
];

const InterviewCalendar: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date(2025, 9, 27)); // Oct 27, 2025 (Monday)
  const [selectedEvent, setSelectedEvent] = useState<Interview | null>(null);

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
    return sampleInterviews.filter(event => isSameDay(event.start, date));
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
                  {getEventsForDay(day).map((event) => {
                    const { top, height } = getEventPosition(event);
                    return (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="absolute left-1 right-1 rounded-lg p-2 cursor-pointer hover:opacity-80 transition overflow-hidden"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: event.color,
                          minHeight: '40px'
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
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
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
                  <p className="text-slate-800">{selectedEvent.position}</p>
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