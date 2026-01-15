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
  candidate_response?: 'accepted' | 'declined' | 'pending'
  interviewer_response?: 'accepted' | 'declined' | 'pending'
  meeting_link?: string
  interviewers?: Array<{ name: string; avatar: string }>
  notes?: string
}

export default function InterviewCalendarWithSidebar({ 
  interviews,
  sheetOpen = false,
  setSheetOpen = () => {}
}: { 
  interviews: InterviewSchedule[];
  sheetOpen?: boolean;
  setSheetOpen?: (open: boolean) => void;
}) {

  return (
    <div className="h-full flex">
      {/* Main Calendar Content */}
      <div className="flex-1">
        <InterviewCalendar interviews={interviews} />
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