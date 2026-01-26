'use client'

import React, { useState } from 'react'
import InterviewCalendar from './interview-calendar'
import UpcomingInterviewsSidebar from './upcoming-interviews-sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface InterviewSchedule {
  interview_id: string;
  id?: string; // Keep for backward compatibility
  first_name?: string; // Keep for backward compatibility
  last_name?: string; // Keep for backward compatibility
  interview_date: string;
  start_time: string;
  duration_minutes?: number;
  duration?: string;
  status: 'scheduled' | 'completed' | 'overdue';
  interview_type: string;
  meeting_location?: string;
  candidate_response?: 'accepted' | 'declined' | 'pending';
  interviewer_response?: 'accepted' | 'declined' | 'pending';
  meeting_link?: string;
  note: string | null;
  created_at: string;
  candidate: {
    id: string;
    dob: string | null;
    city: string;
    email: string;
    phone: string;
    state: string;
    avatar: string | null;
    gender: string;
    subjects: any[];
    education: any[];
    last_name: string;
    first_name: string;
    resume_url: string;
    teaching_experience: any[];
  };
  job: {
    id: string;
    plan: string;
    title: string;
    status: string;
    openings: number;
    created_by: any;
    hired_count: number;
    hiring_urgency: string;
  };
  organiser: {
    id: string;
    role: string;
    email: string;
    avatar: string;
    last_name: string;
    first_name: string;
  };
  panelists: {
    id: string;
    role: string;
    email: string;
    avatar: string;
    last_name: string;
    first_name: string;
  }[];
  // Legacy fields for backward compatibility
  candidate_email?: string;
  candidate_phone?: string;
  job_title?: string;
  interviewers?: Array<{ id?: string; first_name?: string; last_name?: string; email?: string; avatar?: string; role?: string; name?: string }>;
  organizer?: { id?: string; first_name?: string; last_name?: string; email?: string; avatar?: string; role?: string; name?: string };
  notes?: string;
  // Nested job structure for backward compatibility
  job_object?: {
    id: string;
    title: string;
    status: string;
    hiring_urgency?: string;
    openings: number;
    hired_count: number;
    created_by?: {
      id?: string;
      first_name?: string;
      last_name?: string;
      avatar?: string;
    };
  };
}

export default function InterviewCalendarWithSidebar({ 
  interviews,
  sheetOpen = false,
  setSheetOpen = () => {},
  view,
  setView,
  currentDate,
  setCurrentDate,
  onInterviewClick
}: { 
  interviews: InterviewSchedule[];
  sheetOpen?: boolean;
  setSheetOpen?: (open: boolean) => void;
  view?: 'day' | 'week' | 'month';
  setView?: (view: 'day' | 'week' | 'month') => void;
  currentDate?: Date;
  setCurrentDate?: (date: Date) => void;
  onInterviewClick?: (interview: InterviewSchedule) => void;
}) {

  return (
    <div className="h-full flex">
      {/* Main Calendar Content */}
      <div className="flex-1">
        <InterviewCalendar 
          interviews={interviews} 
          view={view} 
          setView={setView} 
          currentDate={currentDate} 
          setCurrentDate={setCurrentDate}
          onInterviewClick={onInterviewClick}
        />
      </div>

      {/* Desktop Sidebar - Hidden on small screens */}
      <div className="hidden lg:block">
        <UpcomingInterviewsSidebar interviews={interviews} />
      </div>



      {/* Mobile Sheet for Upcoming Interviews */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-80 p-0">
          <SheetHeader className="p-6 border-b">
            <SheetTitle>Upcoming Interviews</SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-auto">
            <UpcomingInterviewsSidebar interviews={interviews} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}