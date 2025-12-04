"use client"

import React, { memo, useCallback, useMemo, useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertTitle } from "./ui/alert"
import { Button } from "./ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from '@/lib/supabase/api/client'
import { SlotPreviewDialog } from "@/components/slot-preview-dialog"
import { InterviewSettingsSheet } from "@/components/interview-settings-sheet"

// Memoized RadioCard component
const RadioCard = memo(({
  checked,
  onChange,
  title,
  description,
  id,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  title: string
  description: string
  id: string
  children?: React.ReactNode
}) => {
  const handleLabelClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
      return;
    }
    e.stopPropagation();
  }, []);

  const handleCheckboxChange = useCallback(() => {
    onChange(!checked);
  }, [checked, onChange]);

  return (
    <div className={`flex flex-col gap-4 px-4 py-3 rounded-md cursor-pointer transition-colors ${checked ? "border border-blue-300 text-blue-800" : "hover:bg-gray-50 border border-gray-200"}`}>
      <label
        htmlFor={id}
        className="flex items-center gap-4"
        onClick={handleLabelClick}
      >
        <input
          type="checkbox"
          id={id}
          name={id}
          checked={checked}
          onChange={handleCheckboxChange}
          className="accent-blue-600 w-5 h-5 shrink-0"
        />
        <div>
          <div className="text-base font-medium text-gray-900">{title}</div>
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        </div>
      </label>
      {checked && children && (
        <div className="pl-9 space-y-2">
          {children}
        </div>
      )}
    </div>
  )
})
RadioCard.displayName = 'RadioCard'

// Memoized warning alert component
const WarningAlert = memo(({ message }: { message: string }) => (
  <Alert variant="warning" className="items-center gap-2 mt-2">
    <AlertTitle>{message}</AlertTitle>
  </Alert>
))
WarningAlert.displayName = 'WarningAlert'

interface ScreeningValues {
  assessment: boolean
  assessmentDifficulty: string | undefined
  numberOfQuestions: number | undefined
  minimumPassingMarks: number | undefined
  demoVideo: boolean
  demoVideoDuration: number | undefined
  demoVideoPassingScore: number | undefined
  interviewScheduling: boolean
}

export interface InterviewSettingsData {
  default_interview_type: 'in-person' | 'online' | 'phone';
  default_duration: string;
  buffer_time: string;
  working_hours_start: string;
  working_hours_end: string;
  candidate_reminder_hours: string;
  interviewer_reminder_hours: string;
  custom_instructions: string;
}

export interface WorkingDay {
  day: string;
  enabled: boolean;
  start_time: string;
  end_time: string;
  slot_duration: string;
}

export interface BreakPeriod {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
}

export interface Slot {
  day: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

export interface ExtendedInterviewSettings extends InterviewSettingsData {
  working_days: WorkingDay[];
  breaks: BreakPeriod[];
  // Add slots property to store individual slots
  slots?: IndividualSlot[];
}

export interface IndividualSlot {
  id: string;
  day: string;
  start_time: string;
  duration: string; // in minutes
}

export const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

export const ScreeningSettings = memo(({
  values,
  onChange,
  schoolId, // Make schoolId optional
  jobId,
  onSaveJobSettings,
}: {
  values: ScreeningValues
  onChange: (values: ScreeningValues) => void
  schoolId?: string // Make schoolId optional
  jobId?: string
  onSaveJobSettings?: (settings: ExtendedInterviewSettings) => Promise<void>
}) => {
  console.log('ScreeningSettings props:', { values, schoolId, jobId });
  console.log('ScreeningSettings: schoolId value:', schoolId);
  const [interviewSettings, setInterviewSettings] = useState<ExtendedInterviewSettings | null>(null);
  
  // Add logging when interviewSettings are updated
  useEffect(() => {
    console.log('interviewSettings updated:', interviewSettings);
  }, [interviewSettings]);
  const [individualSlots, setIndividualSlots] = useState<IndividualSlot[]>([]);
  
  // Add logging when individualSlots are updated
  useEffect(() => {
    console.log('individualSlots updated:', individualSlots);
  }, [individualSlots]);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // Add state for preview dialog
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [resolvedSchoolId, setResolvedSchoolId] = useState<string | null>(schoolId || null); // Add state for resolved schoolId

  // Fetch schoolId from admin_user_info if not provided
  useEffect(() => {
    const fetchSchoolId = async () => {
      if (schoolId) {
        // If schoolId is already provided, use it
        setResolvedSchoolId(schoolId);
        return;
      }
      
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('No user found');
          return;
        }
        
        const { data, error } = await supabase
          .from('admin_user_info')
          .select('school_id')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching school info:', error);
          return;
        }
        
        if (data?.school_id) {
          setResolvedSchoolId(data.school_id);
        }
      } catch (error) {
        console.error('Error fetching school ID:', error);
      }
    };
    
    if (!schoolId) {
      fetchSchoolId();
    } else {
      setResolvedSchoolId(schoolId);
    }
  }, [schoolId]);

  // Fetch interview settings
  useEffect(() => {
    console.log('ScreeningSettings: useEffect triggered', { interviewScheduling: values.interviewScheduling, resolvedSchoolId, jobId });
    
    const fetchInterviewSettings = async () => {
      // If jobId is provided, try to fetch job-specific settings first
      if (jobId) {
        try {
          setLoadingSettings(true);
          const supabase = createClient();
          
          // Try to fetch job-specific settings
          const { data: jobSettings, error: jobError } = await supabase
            .from('job_meeting_settings')
            .select('*')
            .eq('job_id', jobId)
            .single();
          
          if (!jobError && jobSettings) {
            console.log('Found job-specific settings:', jobSettings);
            
            const jobSpecificSettings: ExtendedInterviewSettings = {
              default_interview_type: jobSettings.default_interview_type || 'in-person',
              default_duration: jobSettings.default_duration || '30',
              buffer_time: '15', // Not in job_meeting_settings table
              working_hours_start: '09:00', // Not in job_meeting_settings table
              working_hours_end: '17:00', // Not in job_meeting_settings table
              candidate_reminder_hours: jobSettings.candidate_reminder_hours || '24',
              interviewer_reminder_hours: jobSettings.interviewer_reminder_hours || '1',
              custom_instructions: jobSettings.custom_instructions || '',
              working_days: DAYS_OF_WEEK.map(day => ({
                day: day.value,
                enabled: false, // Will be set based on slots
                start_time: '09:00',
                end_time: '17:00',
                slot_duration: '30'
              })),
              breaks: [], // Not in job_meeting_settings table
              slots: jobSettings.slots || []
            };
            
            setInterviewSettings(jobSpecificSettings);
            setIndividualSlots(jobSettings.slots || []);
            setLoadingSettings(false);
            return;
          }
        } catch (error) {
          console.error('Error fetching job-specific settings:', error);
          // Continue to fetch school settings if job-specific settings fail
        }
      }
      
      // If no jobId or job-specific settings not found, fetch school settings
      if (!resolvedSchoolId) {
        console.log('ScreeningSettings: No resolvedSchoolId, setting default settings');
        // Set default settings when no school ID
        const defaultSettings: ExtendedInterviewSettings = {
          default_interview_type: 'in-person',
          default_duration: '30',
          buffer_time: '15',
          working_hours_start: '09:00',
          working_hours_end: '17:00',
          candidate_reminder_hours: '24',
          interviewer_reminder_hours: '1',
          custom_instructions: '',
          working_days: DAYS_OF_WEEK.map(day => ({
            day: day.value,
            enabled: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day.value),
            start_time: '09:00',
            end_time: '17:00',
            slot_duration: '30'
          })),
          breaks: [],
          slots: []
        };
        setInterviewSettings(defaultSettings);
        setLoadingSettings(false);
        return;
      }
      
      try {
        setLoadingSettings(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .rpc('get_interview_meeting_settings', { p_school_id: resolvedSchoolId });
        
        console.log('RPC call result:', { data, error });
        
        if (error) throw error;
        
        // Log raw data for debugging
        console.log('Raw interview settings data from RPC:', data);
        
        let settingsData;
        if (data && data.length > 0) {
          settingsData = Array.isArray(data) ? data[0] : data;
          console.log('Processed settings data:', settingsData);
        } else {
          // Set default settings when no data found
          settingsData = {
            default_interview_type: 'in-person',
            default_duration: '30',
            buffer_time: '15',
            working_hours_start: '09:00',
            working_hours_end: '17:00',
            candidate_reminder_hours: '24',
            interviewer_reminder_hours: '1',
            custom_instructions: '',
            working_days: DAYS_OF_WEEK.map(day => ({
              day: day.value,
              enabled: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day.value),
              start_time: '09:00',
              end_time: '17:00',
              slot_duration: '30'
            })),
            breaks: [],
            slots: []
          };
        }
        
        const finalSettings: ExtendedInterviewSettings = {
          default_interview_type: settingsData.default_interview_type || 'in-person',
          default_duration: settingsData.default_duration || '30',
          buffer_time: settingsData.buffer_time || '15',
          working_hours_start: settingsData.working_hours_start || '09:00',
          working_hours_end: settingsData.working_hours_end || '17:00',
          candidate_reminder_hours: settingsData.candidate_reminder_hours || '24',
          interviewer_reminder_hours: settingsData.interviewer_reminder_hours || '1',
          custom_instructions: settingsData.custom_instructions || '',
          working_days: settingsData.working_days || DAYS_OF_WEEK.map(day => ({
            day: day.value,
            enabled: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day.value),
            start_time: '09:00',
            end_time: '17:00',
            slot_duration: '30'
          })),
          breaks: settingsData.breaks || [],
          slots: settingsData.slots || []
        };
        
        // Log the fetched slots for debugging
        console.log('Fetched interview settings:', finalSettings);
        console.log('Fetched individual slots:', settingsData.slots);
        
        // Initialize individual slots from database
        const slotsToSet = settingsData.slots && Array.isArray(settingsData.slots) ? settingsData.slots : [];
        
        // Log slots information
        console.log('Slots to set:', slotsToSet);
        console.log('Slots type:', typeof settingsData.slots);
        console.log('Is slots array:', Array.isArray(settingsData.slots));
        
        setInterviewSettings(finalSettings);
        setIndividualSlots(slotsToSet);
      } catch (error) {
        console.error('Error fetching interview settings:', error);
        console.error('Error details:', {
          name: (error as Error).name,
          message: (error as Error).message,
          stack: (error as Error).stack
        });
        // Set default settings on error
        const defaultSettings: ExtendedInterviewSettings = {
          default_interview_type: 'in-person',
          default_duration: '30',
          buffer_time: '15',
          working_hours_start: '09:00',
          working_hours_end: '17:00',
          candidate_reminder_hours: '24',
          interviewer_reminder_hours: '1',
          custom_instructions: '',
          working_days: DAYS_OF_WEEK.map(day => ({
            day: day.value,
            enabled: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day.value),
            start_time: '09:00',
            end_time: '17:00',
            slot_duration: '30'
          })),
          breaks: [],
          slots: []
        };
        setInterviewSettings(defaultSettings);
      } finally {
        setLoadingSettings(false);
      }
    };
    
    if (values.interviewScheduling) {
      fetchInterviewSettings();
    }
  }, [values.interviewScheduling, resolvedSchoolId, jobId]);

  // Generate slots for preview
  const generateSlots = useCallback((): Slot[] => {
    if (!interviewSettings) return [];
    
    const slots: Slot[] = [];
    const today = new Date();
    
    // Generate slots for the next 7 days
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      // Use individual slots if available, otherwise fall back to working days
      if (individualSlots && individualSlots.length > 0) {
        // Find all individual slots for this day
        const daySlots = individualSlots.filter(slot => slot.day === dayOfWeek);
        
        daySlots.forEach(slot => {
          const slotDuration = parseInt(slot.duration) || 30;
          const startTime = slot.start_time;
          
          // Calculate end time based on start time and duration
          const [startHours, startMinutes] = startTime.split(':').map(Number);
          const startTotalMinutes = startHours * 60 + startMinutes;
          const endTotalMinutes = startTotalMinutes + slotDuration;
          
          const endHours = Math.floor(endTotalMinutes / 60);
          const endMinutes = endTotalMinutes % 60;
          
          const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
          
          slots.push({
            day: dayOfWeek,
            startTime: startTime,
            endTime: endTime,
            isBreak: false
          });
        });
      } else {
        // Fall back to working days approach
        const workingDay = interviewSettings.working_days.find(day => day.day === dayOfWeek);
        
        if (workingDay && workingDay.enabled) {
          const slotDuration = parseInt(workingDay.slot_duration) || 30;
          const startTime = workingDay.start_time;
          const endTime = workingDay.end_time;
          
          // Convert times to minutes for easier calculation
          const [startHours, startMinutes] = startTime.split(':').map(Number);
          const [endHours, endMinutes] = endTime.split(':').map(Number);
          const startTotalMinutes = startHours * 60 + startMinutes;
          const endTotalMinutes = endHours * 60 + endMinutes;
          
          // Add working hour slots
          for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += slotDuration) {
            const slotStartHours = Math.floor(minutes / 60);
            const slotStartMinutes = minutes % 60;
            const slotEndHours = Math.floor((minutes + slotDuration) / 60);
            const slotEndMinutes = (minutes + slotDuration) % 60;
            
            const slotStartTime = `${slotStartHours.toString().padStart(2, '0')}:${slotStartMinutes.toString().padStart(2, '0')}`;
            const slotEndTime = `${slotEndHours.toString().padStart(2, '0')}:${slotEndMinutes.toString().padStart(2, '0')}`;
            
            // Check if this slot overlaps with any break
            const breakPeriod = interviewSettings.breaks.find(breakItem => 
              breakItem.day === dayOfWeek &&
              ((breakItem.start_time <= slotStartTime && breakItem.end_time > slotStartTime) ||
               (breakItem.start_time < slotEndTime && breakItem.end_time >= slotEndTime))
            );
            
            if (!breakPeriod) {
              slots.push({
                day: dayOfWeek,
                startTime: slotStartTime,
                endTime: slotEndTime,
                isBreak: false
              });
            }
          }
          
          // Add break slots
          const dayBreaks = interviewSettings.breaks.filter(breakItem => breakItem.day === dayOfWeek);
          dayBreaks.forEach(breakItem => {
            slots.push({
              day: dayOfWeek,
              startTime: breakItem.start_time,
              endTime: breakItem.end_time,
              isBreak: true
            });
          });
        }
      }
    }
    
    return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [interviewSettings, individualSlots]);

  // Get slots grouped by day for table display
  const getSlotsByDay = useCallback(() => {
    const slots = generateSlots();
    const slotsByDay: Record<string, Slot[]> = {};
    
    DAYS_OF_WEEK.forEach(day => {
      slotsByDay[day.value] = slots.filter(slot => slot.day === day.value);
    });
    
    return slotsByDay;
  }, [generateSlots]);

  const slotsByDay = useMemo(() => getSlotsByDay(), [getSlotsByDay]);

  // Memoize calculated values
  const numberOfQuestions = useMemo(() => 
    values.numberOfQuestions !== undefined ? Math.max(5, values.numberOfQuestions) : 5,
    [values.numberOfQuestions]
  )

  const minimumPassingMarks = useMemo(() => 
    (values.minimumPassingMarks !== undefined && values.minimumPassingMarks !== null) 
      ? values.minimumPassingMarks 
      : 0,
    [values.minimumPassingMarks]
  )

  const demoVideoDuration = useMemo(() => 
    Math.max(2, values.demoVideoDuration || 2),
    [values.demoVideoDuration]
  )

  const demoVideoPassingScore = useMemo(() => 
    Math.max(1, values.demoVideoPassingScore || 1),
    [values.demoVideoPassingScore]
  )

  // Memoize handlers
  const handleAssessmentChange = useCallback((checked: boolean) => {
    const newValues = { ...values, assessment: checked };
    if (checked) {
      if (!values.assessmentDifficulty) {
        newValues.assessmentDifficulty = 'medium';
      }
      if (!values.numberOfQuestions) {
        newValues.numberOfQuestions = 5;
      }
      if (values.minimumPassingMarks === undefined || values.minimumPassingMarks === null) {
        newValues.minimumPassingMarks = 0;
      }
    }
    onChange(newValues);
  }, [values, onChange])

  const handleDifficultyChange = useCallback((value: string) => {
    onChange({ ...values, assessmentDifficulty: value });
  }, [values, onChange])

  const handleQuestionsChange = useCallback((value: number[]) => {
    onChange({ ...values, numberOfQuestions: Math.max(5, value[0]) });
  }, [values, onChange])

  const handlePassingMarksChange = useCallback((value: string) => {
    onChange({ ...values, minimumPassingMarks: parseInt(value) });
  }, [values, onChange])

  const handleDemoVideoChange = useCallback((checked: boolean) => {
    const newValues = { ...values, demoVideo: checked };
    if (checked && (!values.demoVideoDuration || values.demoVideoDuration < 2)) {
      newValues.demoVideoDuration = 2;
    }
    if (checked && (!values.demoVideoPassingScore || values.demoVideoPassingScore < 1)) {
      newValues.demoVideoPassingScore = 1;
    }
    onChange(newValues);
  }, [values, onChange])

  const handleDemoVideoDurationChange = useCallback((value: number[]) => {
    onChange({ ...values, demoVideoDuration: Math.max(2, value[0]) });
  }, [values, onChange])

  const handleDemoVideoScoreChange = useCallback((value: string) => {
    onChange({ ...values, demoVideoPassingScore: parseInt(value) });
  }, [values, onChange])

  const handleInterviewChange = useCallback((checked: boolean) => {
    onChange({ ...values, interviewScheduling: checked });
  }, [values, onChange])

  // New handler for interview type change
  const handleInterviewTypeChange = useCallback((value: 'in-person' | 'online' | 'phone') => {
    if (interviewSettings) {
      setInterviewSettings({
        ...interviewSettings,
        default_interview_type: value
      });
    }
  }, [interviewSettings]);

  // Memoize passing marks options
  const passingMarksOptions = useMemo(() => 
    [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    []
  )

  const demoScoreOptions = useMemo(() => 
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    []
  )

  return (
    <div className="space-y-4">
      <RadioCard
        id="assessment"
        checked={values.assessment}
        onChange={handleAssessmentChange}
        title="Multiple Choice Questions (MCQs)"
        description="Enable MCQ assessment for candidates. This will test their knowledge and skills relevant to the role with multiple choice questions."
      >
        <>
          <div className="space-y-2 flex flex-col w-full">
            <Label htmlFor="assessment-difficulty" className="text-sm font-medium text-gray-700">
              Assessment Difficulty
            </Label>
            <Select
              value={values.assessmentDifficulty || 'medium'}
              onValueChange={handleDifficultyChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select difficulty level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy - Basic concepts and fundamental knowledge</SelectItem>
                <SelectItem value="medium">Medium - Standard curriculum and practical application</SelectItem>
                <SelectItem value="hard">Hard - Advanced concepts and critical thinking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="number-of-questions" className="text-sm font-medium text-gray-700">
              Number of Questions: {numberOfQuestions}
            </Label>
            <Slider
              id="number-of-questions"
              min={0}
              max={30}
              step={5}
              value={[numberOfQuestions]}
              onValueChange={handleQuestionsChange}
              className="w-full"
            />
            {numberOfQuestions > 20 && (
              <WarningAlert message="Setting too many questions may increase drop-off rates — keep it concise for better completion." />
            )}
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="minimum-passing-marks" className="text-sm font-medium text-gray-700">
              Minimum Passing Marks: {minimumPassingMarks}%
            </Label>
            <Select
              value={minimumPassingMarks.toString()}
              onValueChange={handlePassingMarksChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select passing marks" />
              </SelectTrigger>
              <SelectContent>
                {passingMarksOptions.map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {minimumPassingMarks > 70 && (
              <WarningAlert message="Setting a high passing threshold may result in more candidates failing, creating a bottleneck in your hiring process." />
            )}
          </div>
        </>
      </RadioCard>

      <RadioCard
        id="demoVideo"
        checked={values.demoVideo}
        onChange={handleDemoVideoChange}
        title="Teaching Demo Video"
        description="Require candidates to submit a short teaching demo video as part of their application."
      >
        {values.demoVideo && (
          <div className="mt-4 space-y-2">
            <Label htmlFor="demo-video-duration" className="text-sm font-medium text-gray-700">
              Video Duration: {demoVideoDuration} minutes
            </Label>
            <Slider
              id="demo-video-duration"
              min={0}
              max={10}
              step={1}
              value={[demoVideoDuration]}
              onValueChange={handleDemoVideoDurationChange}
              className="w-full"
            />
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="demo-video-passing-score" className="text-sm font-medium text-gray-700">
                Passing Demo Score: {demoVideoPassingScore}/10
              </Label>
              <Select
                value={demoVideoPassingScore.toString()}
                onValueChange={handleDemoVideoScoreChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select passing score" />
                </SelectTrigger>
                <SelectContent>
                  {demoScoreOptions.map((value) => (
                    <SelectItem key={value} value={value.toString()}>
                      {value}/10
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {demoVideoPassingScore > 7 && (
                <WarningAlert message="Higher demo score can lead to candidate drop off" />
              )}
            </div>
          </div>
        )}
      </RadioCard>

      <RadioCard
        id="interviewScheduling"
        checked={values.interviewScheduling}
        onChange={handleInterviewChange}
        title="Interview Scheduling"
        description="Allow recruiters to schedule interviews after screening."
      >
        {values.interviewScheduling && (
          <div className="mt-4 space-y-4">
            {loadingSettings ? (
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <p className="text-blue-800">Loading interview settings...</p>
              </div>
            ) : interviewSettings ? (
              <>
                {/* Interview Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="default_interview_type">Default Interview Type</Label>
                  <Select 
                    value={interviewSettings.default_interview_type} 
                    onValueChange={(value) => {
                      if (interviewSettings) {
                        setInterviewSettings({
                          ...interviewSettings,
                          default_interview_type: value as 'in-person' | 'online' | 'phone'
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select interview type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">In-person</SelectItem>
                      <SelectItem value="online">Online (Google Meet / Zoom)</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsPreviewOpen(true)} // Open preview dialog on click
                  >
                    View Slots: {individualSlots.length}
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => setIsEditSheetOpen(true)}
                  >
                    Edit Slots
                  </Button>
                </div>
                
                {/* Slot Preview Dialog */}
                <SlotPreviewDialog 
                  isOpen={isPreviewOpen}
                  onOpenChange={setIsPreviewOpen}
                  slotsByDay={slotsByDay}
                  workingDays={interviewSettings.working_days}
                  daysOfWeek={DAYS_OF_WEEK}
                />
                
                {/* Interview Settings Sheet */}
                <InterviewSettingsSheet
                  open={isEditSheetOpen}
                  onOpenChange={(open) => {
                    console.log('InterviewSettingsSheet onOpenChange called', { open });
                    setIsEditSheetOpen(open);
                    // When closing the sheet, refresh the slots to show the latest data
                    if (!open && interviewSettings) {
                      // The sheet will update individualSlots when saving, so we don't need to do anything here
                    }
                  }}
                  schoolId={resolvedSchoolId || undefined} // Pass resolvedSchoolId
                  jobId={jobId} // Pass jobId
                  onSave={(settings) => {
                    console.log('InterviewSettingsSheet onSave called', settings);
                    setInterviewSettings(settings);
                    // Update individual slots if they exist in the settings
                    const extendedSettings = settings as ExtendedInterviewSettings;
                    if (extendedSettings.slots && Array.isArray(extendedSettings.slots)) {
                      setIndividualSlots(extendedSettings.slots);
                    }
                  }}
                  onUpdateDefaultSettings={async (settings) => {
                    // This function will be called when user chooses to update default settings
                    console.log('Updating default settings with:', settings);
                    // If we have a callback to save job settings, use it
                    if (onSaveJobSettings) {
                      console.log('Calling onSaveJobSettings callback');
                      await onSaveJobSettings(settings);
                    }
                    // Update the local state with the new settings
                    setInterviewSettings(settings);
                    if (settings.slots && Array.isArray(settings.slots)) {
                      setIndividualSlots(settings.slots);
                    }
                  }}
                />

              </>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <p className="text-yellow-800">
                  No interview settings found for this school. Please configure interview settings in the admin panel.
                </p>
              </div>
            )}
          </div>
        )}
      </RadioCard>
    </div>
  )
})
ScreeningSettings.displayName = 'ScreeningSettings'