'use client'
import { Button } from "@/components/ui/button";
import { Plus, ListFilter } from "lucide-react";
import '@/styles/interview.css'
import InterviewCalendarWithSidebar from "@/components/interview-calendar-with-sidebar";
import { mockInterviews } from "@/components/interview-calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import CandidatesList from "@/components/interview-candidates-list";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ButtonGroup } from "@/components/ui/button-group";
import { useState } from "react";



export default function Page() {
  const [candidateSheetOpen, setCandidateSheetOpen] = useState(false);
  const [upcomingInterviewsSheetOpen, setUpcomingInterviewsSheetOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [isPanelist, setIsPanelist] = useState(false);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
const statusBadgeClass = {
  all: "bg-purple-100 text-purple-700 border-purple-200",
  scheduled: "bg-orange-100 text-orange-700 border-orange-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
  completed: "bg-green-100 text-green-700 border-green-200",
}

  return (
    <div className="interview-container">
      <div className="interview-header border-b border-gray-100">
        <h1 className="interview-title">Interviews</h1>
        <div className="flex items-center gap-2">
          {/* Responsive Filter Component */}
          <ResponsiveInterviewFilters 
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            assignedToMe={assignedToMe}
            setAssignedToMe={setAssignedToMe}
            isPanelist={isPanelist}
            setIsPanelist={setIsPanelist}
            filterPopoverOpen={filterPopoverOpen}
            setFilterPopoverOpen={setFilterPopoverOpen}
          />
          

          
          <div className="flex items-center gap-2">
            {/* Create Interview Button */}
            <Button
              variant="outline"
              className='bg-gradient-to-r from-purple-500 to-purple-700 text-white flex items-center justify-between px-4 py-2 min-w-[160px] relative'
              onClick={() => setCandidateSheetOpen(true)}
            >
              <span className="flex items-center">
                <Plus className="mr-2 text-white" size={18} />
                Create Interview
              </span>
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-purple-700 text-xs font-bold">
                10
              </span>
            </Button>
            
            {/* Mobile Dropdown Menu */}
            <div className="lg:hidden">
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="p-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setDropdownOpen(false);
                    setUpcomingInterviewsSheetOpen(true);
                  }}>
                    View Upcoming Interviews
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      <Sheet open={candidateSheetOpen} onOpenChange={setCandidateSheetOpen}>
  <SheetContent
    side="right"
    className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl p-0 flex flex-col"
  >
    <header className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900">
        Select Candidate
      </h2>
      <p className="text-sm text-gray-500">
        Candidates ready for interview scheduling
      </p>
    </header>

    <div className="flex-1 overflow-y-auto">
      <CandidatesList />
    </div>
  </SheetContent>
</Sheet>

      {/* <div className="flex flex-col md:flex-row gap-4 w-full flex-1 min-h-0 px-4 pb-4"> */}
        {/* <div className="flex flex-col min-h-0 overflow-hidden"> */}
          <InterviewCalendarWithSidebar 
            interviews={mockInterviews} 
            sheetOpen={upcomingInterviewsSheetOpen}
            setSheetOpen={setUpcomingInterviewsSheetOpen}
          />
        {/* </div> */}
       {/* <div className="md:w-1/3 flex flex-col min-h-0 overflow-hidden">  */}
           {/* <CandidatesList /> */}
        {/* </div>  */}
      {/* </div> */}
    </div>
  );
}
type StatusKey = 'all' | 'scheduled' | 'overdue' | 'completed'

const STATUS_CONFIG: Record<StatusKey, { label: string; count: number }> = {
  all: { label: "All", count: 10 },
  scheduled: { label: "Scheduled", count: 5 },
  overdue: { label: "Overdue", count: 2 },
  completed: { label: "Completed", count: 3 },
}

const STATUS_COLORS = {
  all: { bg: "#F3E8FF", text: "#6B21A8", border: "#D8B4FE" },
  scheduled: { bg: "#FFEDD5", text: "#9A3412", border: "#FDBA74" },
  overdue: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
  completed: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
}
interface ResponsiveInterviewFiltersProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  assignedToMe: boolean;
  setAssignedToMe: (value: boolean) => void;
  isPanelist: boolean;
  setIsPanelist: (value: boolean) => void;
  filterPopoverOpen: boolean;
  setFilterPopoverOpen: (open: boolean) => void;
}

function ResponsiveInterviewFilters({
  activeFilter,
  setActiveFilter,
  assignedToMe,
  setAssignedToMe,
  isPanelist,
  setIsPanelist,
  filterPopoverOpen,
  setFilterPopoverOpen,
}: ResponsiveInterviewFiltersProps) {
  return (
    <div className="flex items-center justify-between gap-3 w-full">

      {/* DESKTOP STATUS FILTERS (lg+) */}
      <div className="hidden lg:flex items-center gap-1 rounded-lg border border-gray-200 p-1">
        {(Object.keys(STATUS_CONFIG) as StatusKey[]).map((key) => {
          const cfg = STATUS_CONFIG[key]
          const color = STATUS_COLORS[key]
          const active = activeFilter === key

          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                active
                  ? "bg-white text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {cfg.label}
              <span
                className="ml-2 text-xs px-1.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: active ? color.bg : "#F3F4F6",
                  color: active ? color.text : "#9CA3AF",
                  borderColor: active ? color.border : "#E5E7EB",
                }}
              >
                {cfg.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* FILTER POPOVER (ALL SCREENS) */}
      <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 flex items-center gap-2"
          >
            <ListFilter className="h-4 w-4" />
            <span className="hidden lg:inline text-sm">Filters</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-72 p-4 space-y-4">

          {/* STATUS FILTERS (shown when collapsed) */}
          <div className="lg:hidden space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Status
            </p>

            {(Object.keys(STATUS_CONFIG) as StatusKey[]).map((key) => {
              const cfg = STATUS_CONFIG[key]
              const color = STATUS_COLORS[key]
              const active = activeFilter === key

              return (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm ${
                    active
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{cfg.label}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: active ? color.bg : "#F3F4F6",
                      color: active ? color.text : "#9CA3AF",
                      borderColor: active ? color.border : "#E5E7EB",
                    }}
                  >
                    {cfg.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ADVANCED FILTERS */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Advanced
            </p>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={assignedToMe}
                onCheckedChange={(v) => setAssignedToMe(Boolean(v))}
              />
              Jobs assigned to me
            </label>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isPanelist}
                onCheckedChange={(v) => setIsPanelist(Boolean(v))}
              />
              Panelist
            </label>
          </div>

          {/* CTA */}
          <div className="pt-2">
            <Button className="w-full" size="sm">
              Apply Filters
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}