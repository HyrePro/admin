'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createClient } from '@/lib/supabase/api/client';
import { toast } from "sonner";
import { SlotPreviewDialog } from "@/components/slot-preview-dialog";
import { UpdateDefaultSettingsDialog } from "@/components/update-default-settings-dialog";
import { X, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { InterviewSettingsData, WorkingDay, BreakPeriod, Slot, ExtendedInterviewSettings, IndividualSlot, DAYS_OF_WEEK } from "./screening-settings"

interface SlotConfig {
  start_time: string;
  end_time: string;
  slot_duration: string;
}

interface SettingsErrors {
  working_days?: string;
  breaks?: string;
  slots?: string;
}

interface InterviewSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId?: string;
  jobId?: string;
  onSave: (settings: ExtendedInterviewSettings) => void;
  onUpdateDefaultSettings?: (settings: ExtendedInterviewSettings) => void;
}

// Helper function to check if two time periods overlap
const doTimesOverlap = (start1: string, duration1: string, start2: string, duration2: string): boolean => {
  const [hours1, minutes1] = start1.split(':').map(Number);
  const [hours2, minutes2] = start2.split(':').map(Number);
  
  const startTime1 = hours1 * 60 + minutes1;
  const endTime1 = startTime1 + parseInt(duration1);
  
  const startTime2 = hours2 * 60 + minutes2;
  const endTime2 = startTime2 + parseInt(duration2);
  
  return startTime1 < endTime2 && startTime2 < endTime1;
};

// Helper function to convert time string to minutes
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert minutes to time string
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export function InterviewSettingsSheet({ 
  open, 
  onOpenChange, 
  schoolId, 
  jobId,
  onSave,
  onUpdateDefaultSettings
}: InterviewSettingsSheetProps) {
  const [saving, setSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [newSlotConfig, setNewSlotConfig] = useState<SlotConfig>({
    start_time: '09:00',
    end_time: '17:00',
    slot_duration: '30'
  });
  const [individualSlots, setIndividualSlots] = useState<IndividualSlot[]>([]);
  const [originalSlots, setOriginalSlots] = useState<IndividualSlot[]>([]);
  const [slotsModified, setSlotsModified] = useState(false);
  const [resolvedSchoolId, setResolvedSchoolId] = useState<string | null>(schoolId || null);
  const [showUpdateDefaultDialog, setShowUpdateDefaultDialog] = useState(false);
  const [settingsToSave, setSettingsToSave] = useState<ExtendedInterviewSettings | null>(null);
  
  // Interview settings state
  const [interviewSettings, setInterviewSettings] = useState<ExtendedInterviewSettings>({
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
    breaks: []
  });
  
  const [settingsErrors, setSettingsErrors] = useState<SettingsErrors>({});
  
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
  
  // Fetch interview settings from Supabase
  useEffect(() => {
    const fetchInterviewSettings = async () => {
      if (!resolvedSchoolId) return;
      
      try {
        const supabase = createClient();
      
        // Fetch school default settings
        const { data, error } = await supabase
          .rpc('get_interview_meeting_settings', { p_school_id: resolvedSchoolId });
        
        if (error) throw error;
        
        // Transform the returned data to match our state structure
        if (data && data.length > 0) {
          // If we get an array back (which is what RPC functions typically return)
          let settingsData = Array.isArray(data) ? data[0] : data;
                    
          // Ensure the data is serializable
          settingsData = JSON.parse(JSON.stringify(settingsData));
                    
          const updatedSettings = {
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
                    
          setInterviewSettings(updatedSettings);
                    
          // Initialize individual slots from database
          const slotsToSet = settingsData.slots && Array.isArray(settingsData.slots) ? settingsData.slots : [];
          setIndividualSlots(slotsToSet);
          setOriginalSlots(slotsToSet);
        }
      } catch (error) {
        console.error('Error fetching interview settings:', error);
        // Not showing error to user as this is optional
      }
    };
    
    if (resolvedSchoolId && open) {
      fetchInterviewSettings();
    }
  }, [resolvedSchoolId, jobId, open]);
  
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
  
  // Validate settings before saving
  const validateSettings = useCallback(() => {
    const errors: SettingsErrors = {};
    
    setSettingsErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);
  
  // Add slot configuration for selected days
  const addSlotConfiguration = useCallback(() => {
    console.log('addSlotConfiguration called', { selectedDays, newSlotConfig });
    
    if (selectedDays.length === 0) {
      toast.error('Please select at least one day');
      return;
    }
    
    // Validate that end time is after start time
    const startTimeMinutes = timeToMinutes(newSlotConfig.start_time);
    const endTimeMinutes = timeToMinutes(newSlotConfig.end_time);
    const duration = parseInt(newSlotConfig.slot_duration);
    
    if (endTimeMinutes <= startTimeMinutes) {
      toast.error('End time must be after start time');
      return;
    }
    
    if (duration <= 0) {
      toast.error('Duration must be greater than 0');
      return;
    }
    
    // Calculate how many complete slots fit in the time range
    const totalTimeRange = endTimeMinutes - startTimeMinutes;
    const numberOfSlots = Math.floor(totalTimeRange / duration);
    
    if (numberOfSlots === 0) {
      toast.error('Time range is too short for the specified duration');
      return;
    }
    
    // Create new slots for each selected day
    const newSlots: IndividualSlot[] = [];
    const currentTime = new Date().getTime();
    
    selectedDays.forEach(day => {
      // Create multiple slots within the time range
      for (let i = 0; i < numberOfSlots; i++) {
        const slotStartTimeMinutes = startTimeMinutes + (i * duration);
        const slotEndTimeMinutes = slotStartTimeMinutes + duration;
        
        const newSlot: IndividualSlot = {
          id: `slot_${currentTime}_${day}_${i}`,
          day: day,
          start_time: minutesToTime(slotStartTimeMinutes),
          duration: newSlotConfig.slot_duration
        };
        
        newSlots.push(newSlot);
      }
    });
    
    console.log('Adding new slots:', newSlots);
    setIndividualSlots(prev => [...prev, ...newSlots]);
    setSelectedDays([]); // Clear selection after adding
    
    // Mark slots as modified
    setSlotsModified(true);
    
    toast.success(`Added ${numberOfSlots} slot(s) for ${selectedDays.length} day(s)`);
  }, [selectedDays, newSlotConfig]);
  
  // Remove individual slot
  const removeIndividualSlot = useCallback((slotId: string) => {
    setIndividualSlots(prev => prev.filter(slot => slot.id !== slotId));
    setSlotsModified(true);
  }, []);
  
  // Save interview settings
  const handleSaveSettings = async () => {
    console.log('handleSaveSettings called', { jobId, resolvedSchoolId, individualSlots, originalSlots });
    
    if (!validateSettings()) return;
    
    setSaving(true);
    const toastId = toast.loading('Saving interview settings...');
    
    try {
      // Create a copy of interviewSettings with individual slots converted to working days format
      const settingsToSave: ExtendedInterviewSettings = {
        ...interviewSettings,
        working_days: interviewSettings.working_days.map(day => {
          // Check if there are any individual slots for this day and sort them
          const daySlots = individualSlots
            .filter(slot => slot.day === day.day)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
          
          if (daySlots.length > 0) {
            // Use the first slot's configuration for backward compatibility
            const firstSlot = daySlots[0];
            return {
              ...day,
              enabled: true,
              start_time: firstSlot.start_time,
              end_time: '23:59', // Not used but required by interface
              slot_duration: firstSlot.duration
            };
          }
          
          return day;
        }),
        // Include individual slots in the saved data
        slots: individualSlots
      };
      
      // Check if slots have been modified from original
      const slotsChanged = JSON.stringify(individualSlots) !== JSON.stringify(originalSlots);
      console.log('Slots changed:', slotsChanged, { individualSlots, originalSlots });
      
      // If jobId is provided, save as job-specific settings
      if (jobId) {
        console.log('Saving job-specific settings for jobId:', jobId);
        // For job-specific settings, we save directly since we have the job ID
        setSettingsToSave(settingsToSave);
        handleConfirmSave(false); // Save job-specific settings only
      } 
      // If we're configuring school settings and slots have been modified, show dialog
      else if (slotsChanged && resolvedSchoolId) {
        console.log('Showing update default dialog for school settings');
        setSettingsToSave(settingsToSave);
        setShowUpdateDefaultDialog(true);
        // Dismiss the initial toast since we're showing a dialog
        toast.dismiss(toastId);
      } 
      // Otherwise, save directly
      else {
        console.log('Saving settings directly (no jobId, no changes, or no schoolId)');
        // Call the onSave callback with the updated settings
        onSave(settingsToSave);
        toast.success('Interview settings saved successfully!', { id: toastId });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error saving interview settings:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      toast.error('Failed to save interview settings. Please try again.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle confirming to save job settings and optionally update defaults
  const handleConfirmSave = async (updateDefaults: boolean) => {
    console.log('handleConfirmSave called', { updateDefaults, settingsToSave, jobId, resolvedSchoolId });
    
    if (!settingsToSave || (!jobId && !resolvedSchoolId)) return;
    
    const toastId = toast.loading(updateDefaults ? 'Saving and updating default settings...' : 'Saving settings...');
    
    try {
      const supabase = createClient();
      
      // If jobId is provided, save as job-specific settings
      if (jobId) {
        console.log('Saving job-specific settings to job_meeting_settings table');
        // For job-specific settings, we save to job_meeting_settings table
        // First, check if job settings already exist
        const { data: existingJobSettings, error: fetchJobError } = await supabase
          .from('job_meeting_settings')
          .select('id')
          .eq('job_id', jobId)
          .limit(1);
        
        if (fetchJobError) throw fetchJobError;
        
        let jobSaveError;
        
        // If existing job settings found, update them
        if (existingJobSettings && existingJobSettings.length > 0) {
          const { error: updateError } = await supabase
            .from('job_meeting_settings')
            .update({
              job_id: jobId,
              school_id: resolvedSchoolId || undefined,
              slots: settingsToSave.slots
            })
            .eq('id', existingJobSettings[0].id);
          
          jobSaveError = updateError;
        } 
        // Otherwise, insert new job settings
        else {
          const { error: insertError } = await supabase
            .from('job_meeting_settings')
            .insert({
              job_id: jobId,
              school_id: resolvedSchoolId || undefined,
              slots: settingsToSave.slots
            });
          
          jobSaveError = insertError;
        }
        
        if (jobSaveError) throw jobSaveError;
        
        // Call onUpdateDefaultSettings to update the parent component with job-specific settings
        // This is mapped to onSaveJobSettings in the ScreeningSettings component
        if (onUpdateDefaultSettings) {
          console.log('Calling onUpdateDefaultSettings callback');
          onUpdateDefaultSettings(settingsToSave);
        } else {
          // Fallback to onSave if onUpdateDefaultSettings is not provided
          console.log('Calling onSave callback (fallback)');
          onSave(settingsToSave);
        }
      } 
      // Otherwise, we're updating school default settings
      else if (resolvedSchoolId) {
        console.log('Saving school default settings');
        // If user wants to update default settings, save to interview_meeting_settings table
        if (updateDefaults) {
          // First, check if school settings already exist
          const { data: existingSchoolSettings, error: fetchSchoolError } = await supabase
            .from('interview_meeting_settings')
            .select('id')
            .eq('school_id', resolvedSchoolId)
            .limit(1);
          
          if (fetchSchoolError) throw fetchSchoolError;
          
          let schoolSaveError;
          
          // If existing school settings found, update them
          if (existingSchoolSettings && existingSchoolSettings.length > 0) {
            const { error: updateError } = await supabase
              .from('interview_meeting_settings')
              .update({
                school_id: resolvedSchoolId,
                buffer_time: '15', // Default value
                working_hours_start: settingsToSave.working_hours_start,
                working_hours_end: settingsToSave.working_hours_end,
                working_days: settingsToSave.working_days,
                breaks: settingsToSave.breaks,
                slots: settingsToSave.slots
              })
              .eq('id', existingSchoolSettings[0].id);
            
            schoolSaveError = updateError;
          } 
          // Otherwise, insert new school settings
          else {
            const { error: insertError } = await supabase
              .from('interview_meeting_settings')
              .insert({
                school_id: resolvedSchoolId,
                buffer_time: '15', // Default value
                working_hours_start: settingsToSave.working_hours_start,
                working_hours_end: settingsToSave.working_hours_end,
                working_days: settingsToSave.working_days,
                breaks: settingsToSave.breaks,
                slots: settingsToSave.slots
              });
            
            schoolSaveError = insertError;
          }
          
          if (schoolSaveError) throw schoolSaveError;
          
          // Call onSave to update the parent component
          onSave(settingsToSave);
        } 
        // If user doesn't want to update defaults, but we still need to notify the parent component
        // This is the case when the user wants to keep the settings job-specific
        else {
          // Call onUpdateDefaultSettings to notify the parent that job-specific settings should be saved
          // This is mapped to onSaveJobSettings in the ScreeningSettings component
          if (onUpdateDefaultSettings) {
            console.log('Calling onUpdateDefaultSettings callback for job-specific settings');
            onUpdateDefaultSettings(settingsToSave);
          } else {
            console.log('Calling onSave callback (fallback)');
            onSave(settingsToSave);
          }
        }
      }
      
      toast.success(updateDefaults ? 'Settings saved and defaults updated!' : 'Settings saved successfully!', { id: toastId });
      setShowUpdateDefaultDialog(false);
      setSettingsToSave(null);
      setSlotsModified(false); // Reset modification flag
      setOriginalSlots(settingsToSave.slots || []); // Update original slots
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings. Please try again.', { id: toastId });
    }
  };
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl flex flex-col"
        style={{ maxWidth: '70vw' }}
      >
        <SheetHeader>
          <SheetTitle>Interview Settings</SheetTitle>
          <SheetDescription>
            Configure the interview workflow for this job post.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto">
          {/* Scheduling Window Section */}
          <div className="space-y-4">
            <div className="space-y-6 pt-2">
              {/* Slot Configuration */}
              <div className="space-y-4 px-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">Available Slots</h5>
                 
                </div>
                
                {/* Add New Slot Form */}
                <div className="border rounded-lg p-4 m-4">
                  <h6 className="font-medium mb-4">Create Specific Time Slots</h6>
                  <p className="text-sm text-gray-600 mb-4">Create individual time slots for specific days. Multiple slots will be generated within the time range based on the duration.</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="slot-start-time">Start Time</Label>
                      <Input
                        id="slot-start-time"
                        type="time"
                        value={newSlotConfig.start_time}
                        onChange={(e) => setNewSlotConfig((prev: SlotConfig) => ({ ...prev, start_time: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="slot-end-time">End Time</Label>
                      <Input
                        id="slot-end-time"
                        type="time"
                        value={newSlotConfig.end_time}
                        onChange={(e) => setNewSlotConfig((prev: SlotConfig) => ({ ...prev, end_time: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="slot-duration">Slot Duration (min)</Label>
                      <Input
                        id="slot-duration"
                        type="number"
                        min="15"
                        step="15"
                        value={newSlotConfig.slot_duration}
                        onChange={(e) => setNewSlotConfig((prev: SlotConfig) => ({ ...prev, slot_duration: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2 flex items-end">
                      <Button 
                        type="button" 
                        onClick={addSlotConfiguration}
                        disabled={selectedDays.length === 0}
                        className="w-full"
                      >
                        Add Time Slots
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Select Days</Label>
                    <TooltipProvider>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
                        {DAYS_OF_WEEK.map((day) => {
                          // Check if adding a slot for this day would cause a conflict
                          // Sort existing slots by start time for consistent conflict checking
                          const existingDaySlots = individualSlots
                            .filter(slot => slot.day === day.value)
                            .sort((a, b) => a.start_time.localeCompare(b.start_time));
                          
                          // Check for conflicts with the new slot configuration
                          const hasConflict = selectedDays.includes(day.value) && 
                            existingDaySlots.some(slot => 
                              doTimesOverlap(
                                slot.start_time, 
                                slot.duration, 
                                newSlotConfig.start_time,
                                (timeToMinutes(newSlotConfig.end_time) - timeToMinutes(newSlotConfig.start_time)).toString()
                              )
                            );
                          
                          // Generate conflict message if needed
                          let conflictMessage = "";
                          if (hasConflict) {
                            const conflictingSlot = existingDaySlots.find(slot => 
                              doTimesOverlap(
                                slot.start_time, 
                                slot.duration, 
                                newSlotConfig.start_time,
                                (timeToMinutes(newSlotConfig.end_time) - timeToMinutes(newSlotConfig.start_time)).toString()
                              )
                            );
                            
                            if (conflictingSlot) {
                              conflictMessage = `Conflicting slot exists: ${conflictingSlot.start_time} (${conflictingSlot.duration} min)`;
                            } else {
                              conflictMessage = "Conflicting slot exists for this time period";
                            }
                          }
                          
                          return (
                            <div 
                              key={day.value} 
                              className={`flex items-center space-x-2 border rounded p-2 cursor-pointer relative ${
                                selectedDays.includes(day.value) 
                                  ? hasConflict 
                                    ? 'bg-red-50 border-red-300' 
                                    : 'bg-blue-50 border-blue-300'
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                if (selectedDays.includes(day.value)) {
                                  setSelectedDays(prev => prev.filter(d => d !== day.value));
                                } else {
                                  setSelectedDays(prev => [...prev, day.value]);
                                }
                              }}
                            >
                              <Checkbox
                                id={`select-${day.value}`}
                                checked={selectedDays.includes(day.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedDays(prev => [...prev, day.value]);
                                  } else {
                                    setSelectedDays(prev => prev.filter(d => d !== day.value));
                                  }
                                }}
                                className="pointer-events-none"
                              />
                              <Label htmlFor={`select-${day.value}`} className="text-sm cursor-pointer flex items-center">
                                {day.label}
                                {hasConflict && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertTriangle className="text-red-500 ml-1 w-4 h-4" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{conflictMessage}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </TooltipProvider>
                  </div>
                </div>
                
                {/* Existing Slot Configurations - Calendar View */}
                <div className="space-y-3 px-4">
                  <h6 className="font-medium">Configured Slots</h6>
                  <div className="border rounded-lg overflow-hidden">
                    {/* Generate time-based grid */}
                    {(() => {
                      // Determine the time range based on configured slots
                      if (individualSlots.length === 0) {
                        return (
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                {DAYS_OF_WEEK.map(day => (
                                  <th key={day.value} className="text-center p-2 text-sm font-medium">
                                    {day.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td colSpan={DAYS_OF_WEEK.length} className="text-center p-4 text-muted-foreground">
                                  No slots configured yet. Add time slots above.
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        );
                      }
                      
                      // Find min and max times to create the grid
                      const startTimes = individualSlots.map(slot => {
                        const [hours, minutes] = slot.start_time.split(':').map(Number);
                        return hours * 60 + minutes;
                      });
                      
                      const minTime = Math.min(...startTimes);
                      const maxTime = Math.max(...startTimes.map(time => {
                        // Add duration to get end time
                        const slot = individualSlots.find(s => {
                          const [hours, minutes] = s.start_time.split(':').map(Number);
                          return hours * 60 + minutes === time;
                        });
                        return time + (slot ? parseInt(slot.duration) : 0);
                      }));
                      
                      // Round to nearest 30 minutes
                      const gridStart = Math.floor(minTime / 30) * 30;
                      const gridEnd = Math.ceil(maxTime / 30) * 30;
                      
                      // Generate 30-minute intervals
                      const timeSlots: string[] = [];
                      for (let minutes = gridStart; minutes <= gridEnd; minutes += 30) {
                        const hours = Math.floor(minutes / 60);
                        const mins = minutes % 60;
                        timeSlots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
                      }
                      
                      // Base height for a 30-minute slot (in rem)
                      const baseHeight = 4; // 4rem for 30 minutes
                      
                      // Create a matrix to track which cells are occupied
                      const cellOccupancy: Record<string, boolean> = {};
                      
                      // Populate the matrix with existing slots
                      individualSlots.forEach(slot => {
                        const [startHours, startMinutes] = slot.start_time.split(':').map(Number);
                        const startTimeInMinutes = startHours * 60 + startMinutes;
                        const duration = parseInt(slot.duration);
                        const endTimeInMinutes = startTimeInMinutes + duration;
                        
                        // Calculate which time slots this occupies
                        const startIndex = Math.floor((startTimeInMinutes - gridStart) / 30);
                        const endIndex = Math.ceil((endTimeInMinutes - gridStart) / 30);
                        
                        for (let i = startIndex; i < endIndex; i++) {
                          const timeSlot = timeSlots[i];
                          const key = `${slot.day}-${timeSlot}`;
                          cellOccupancy[key] = true;
                        }
                      });
                      
                      return (
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="text-left p-2 text-sm font-medium w-24">Time</th>
                              {DAYS_OF_WEEK.map(day => (
                                <th key={day.value} className="text-center p-2 text-sm font-medium">
                                  {day.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {timeSlots.map((timeSlot, index) => (
                              <tr key={timeSlot} className="border-b">
                                <td className="text-left p-2 text-xs text-gray-500 w-24">{timeSlot}</td>
                                {DAYS_OF_WEEK.map(day => {
                                  const key = `${day.value}-${timeSlot}`;
                                  const slot = individualSlots.find(s => {
                                    const [hours, minutes] = s.start_time.split(':').map(Number);
                                    const slotStartMinutes = hours * 60 + minutes;
                                    const slotDuration = parseInt(s.duration);
                                    const slotEndMinutes = slotStartMinutes + slotDuration;
                                    const timeSlotMinutes = gridStart + index * 30;
                                    
                                    return s.day === day.value && 
                                           slotStartMinutes <= timeSlotMinutes && 
                                           slotEndMinutes > timeSlotMinutes;
                                  });
                                  
                                  if (slot) {
                                    // Calculate how many time slots this slot spans
                                    const [hours, minutes] = slot.start_time.split(':').map(Number);
                                    const slotStartMinutes = hours * 60 + minutes;
                                    const slotDuration = parseInt(slot.duration);
                                    const timeSlotMinutes = gridStart + index * 30;
                                    const slotStartIndex = Math.floor((slotStartMinutes - gridStart) / 30);
                                    const slotEndIndex = Math.ceil((slotStartMinutes + slotDuration - gridStart) / 30);
                                    const rowSpan = slotEndIndex - slotStartIndex;
                                    
                                    // Only render the cell if this is the start of the slot
                                    if (slotStartMinutes === timeSlotMinutes) {
                                      return (
                                        <td 
                                          key={day.value} 
                                          rowSpan={rowSpan}
                                          className="text-center p-1 border border-gray-200 bg-blue-50 relative"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium">
                                              {slot.start_time}
                                            </span>
                                            <button 
                                              onClick={() => removeIndividualSlot(slot.id)}
                                              className="text-gray-400 hover:text-red-500"
                                            >
                                              <X size={14} />
                                            </button>
                                          </div>
                                        </td>
                                      );
                                    }
                                    // Skip rendering for continuation cells
                                    return null;
                                  }
                                  
                                  return (
                                    <td key={day.value} className="text-center p-1 border border-gray-200 bg-white"></td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="flex justify-between">
            <div></div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleSaveSettings} 
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
      
      {/* Add the UpdateDefaultSettingsDialog */}
      <UpdateDefaultSettingsDialog
        open={showUpdateDefaultDialog}
        onOpenChange={setShowUpdateDefaultDialog}
        onConfirm={() => handleConfirmSave(true)}
        onCancel={() => handleConfirmSave(false)}
        isJobSettings={!!jobId} // Pass whether this is for job settings or school defaults
      />
    </Sheet>
  );
}