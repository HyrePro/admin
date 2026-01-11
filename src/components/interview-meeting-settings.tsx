'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { SlotPreviewDialog } from "@/components/slot-preview-dialog";
import { X } from "lucide-react";
import { UnsavedChangesDialog } from "@/components/unsaved-changes-dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface InterviewSettingsData {
  default_interview_type: 'in-person' | 'online' | 'phone';
  default_duration: string;
  buffer_time: string;
  working_hours_start: string;
  working_hours_end: string;
  candidate_reminder_hours: string;
  interviewer_reminder_hours: string;
  custom_instructions: string;
}

interface WorkingDay {
  day: string;
  enabled: boolean;
  start_time: string;
  end_time: string;
  slot_duration: string; // in minutes
}

interface BreakPeriod {
  id: string;
  day: string; // Associate break with specific day
  start_time: string;
  end_time: string;
}

interface Slot {
  day: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

interface ExtendedInterviewSettings extends InterviewSettingsData {
  working_days: WorkingDay[];
  breaks: BreakPeriod[];
  // Add slots property to store individual slots
  slots?: IndividualSlot[];
}

interface SettingsErrors extends Partial<InterviewSettingsData> {
  working_days?: string;
  breaks?: string;
  slots?: string;
}

interface InterviewMeetingSettingsProps {
  schoolId: string;
  onNavigateAway?: () => void;
}

interface SlotConfig {
  start_time: string;
  end_time: string;
  slot_duration: string;
}

interface IndividualSlot {
  id: string;
  day: string;
  start_time: string;
  duration: string; // in minutes
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

// Fetcher function for interview settings
const fetchInterviewSettings = async (schoolId: string): Promise<ExtendedInterviewSettings> => {
  const response = await fetch(`/api/settings/interviews`);
  if (!response.ok) {
    throw new Error('Failed to fetch interview settings');
  }
  return response.json();
};

const updateInterviewSettings = async ({ schoolId, settings }: { schoolId: string; settings: ExtendedInterviewSettings }): Promise<any> => {
  const response = await fetch('/api/settings/interviews', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    throw new Error('Failed to update interview settings');
  }
  return response.json();
};

export function InterviewMeetingSettings({ schoolId, onNavigateAway }: InterviewMeetingSettingsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Use TanStack Query to fetch interview settings
  const { data: fetchedSettings, isLoading, error, refetch } = useQuery({
    queryKey: ['settings', 'interviews', schoolId],
    queryFn: () => fetchInterviewSettings(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const updateMutation = useMutation({
    mutationFn: updateInterviewSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'interviews', schoolId] });
      toast.success('Interview settings updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Error saving interview settings: ${error.message}`);
    }
  });

  const [saving, setSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [newSlotConfig, setNewSlotConfig] = useState<SlotConfig>({
    start_time: '09:00',
    end_time: '17:00',
    slot_duration: '30'
  });
  const [individualSlots, setIndividualSlots] = useState<IndividualSlot[]>([]);
  
  // State for tracking unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(false);
  
  // Interview settings state
  const [interviewSettings, setInterviewSettings] = useState<ExtendedInterviewSettings>({
    default_interview_type: 'in-person',
    default_duration: '30',
    buffer_time: '0',
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    candidate_reminder_hours: '0',
    interviewer_reminder_hours: '0',
    custom_instructions: '',
    working_days: DAYS_OF_WEEK.map(day => ({
      day: day.value,
      enabled: false,
      start_time: '09:00',
      end_time: '17:00',
      slot_duration: '30' // Default slot duration of 30 minutes
    })),
    breaks: []
  });
  
  const [settingsErrors, setSettingsErrors] = useState<SettingsErrors>({});

  // Set form values when settings are loaded
  useEffect(() => {
    if (fetchedSettings) {
      setInterviewSettings(fetchedSettings);
      // Initialize individual slots from database
      const slotsToSet = fetchedSettings.slots && Array.isArray(fetchedSettings.slots) ? fetchedSettings.slots : [];
      setIndividualSlots(slotsToSet);
    }
  }, [fetchedSettings]);

  // Track when settings have been modified
  useEffect(() => {
    // This effect will run whenever individualSlots change
    // We could implement deep comparison here if needed, but for now we'll just set
    // hasUnsavedChanges to true whenever these values change after initial load
    // Only set to true if we're not in the initial loading phase
    if (individualSlots.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [individualSlots]);

  // Handle beforeunload event to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Handle navigation attempts
  const handleNavigationAttempt = (callback: () => void) => {
    if (hasUnsavedChanges) {
      // Show confirmation dialog
      setShowUnsavedChangesDialog(true);
      // Store the callback to execute after confirmation
      setPendingNavigation(true);
    } else {
      // No unsaved changes, proceed with navigation
      callback();
    }
  };

  // Handle interview settings change
  const handleSettingsChange = (field: keyof ExtendedInterviewSettings, value: string | WorkingDay[] | BreakPeriod[]) => {
    setInterviewSettings(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (settingsErrors[field]) {
      setSettingsErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle working day change
  const handleWorkingDayChange = (dayValue: string, field: keyof WorkingDay, value: string | boolean) => {
    setInterviewSettings(prev => ({
      ...prev,
      working_days: prev.working_days.map(day => 
        day.day === dayValue ? { ...day, [field]: value } : day
      )
    }));
  };

  // Add a new break
  const addBreak = (day: string) => {
    const newBreak: BreakPeriod = {
      id: Date.now().toString(),
      day: day,
      start_time: '12:00',
      end_time: '13:00'
    };
    
    setInterviewSettings(prev => ({
      ...prev,
      breaks: [...prev.breaks, newBreak]
    }));
  };

  // Remove a break
  const removeBreak = (id: string) => {
    setInterviewSettings(prev => ({
      ...prev,
      breaks: prev.breaks.filter(breakItem => breakItem.id !== id)
    }));
  };

  // Handle break change
  const handleBreakChange = (id: string, field: keyof BreakPeriod, value: string) => {
    setInterviewSettings(prev => ({
      ...prev,
      breaks: prev.breaks.map(breakItem => 
        breakItem.id === id ? { ...breakItem, [field]: value } : breakItem
      )
    }));
  };

  // Check if two time ranges overlap
  const doTimesOverlap = (start1: string, duration1: string, start2: string, duration2: string): boolean => {
    const [hours1, minutes1] = start1.split(':').map(Number);
    const [hours2, minutes2] = start2.split(':').map(Number);
    
    const startMinutes1 = hours1 * 60 + minutes1;
    const endMinutes1 = startMinutes1 + parseInt(duration1);
    
    const startMinutes2 = hours2 * 60 + minutes2;
    const endMinutes2 = startMinutes2 + parseInt(duration2);
    
    return startMinutes1 < endMinutes2 && startMinutes2 < endMinutes1;
  };
  
  // Add slot configuration
  const addSlotConfiguration = () => {
    if (selectedDays.length === 0) return;
    
    // Check for conflicts before adding new slots
    const conflictingDays: string[] = [];
    
    selectedDays.forEach(day => {
      const existingSlots = individualSlots.filter(slot => slot.day === day);
      
      const hasConflict = existingSlots.some(slot => 
        doTimesOverlap(
          slot.start_time, 
          slot.duration, 
          newSlotConfig.start_time, 
          newSlotConfig.slot_duration
        )
      );
      
      if (hasConflict) {
        conflictingDays.push(day);
      }
    });
    
    // Show error if there are conflicts
    if (conflictingDays.length > 0) {
      const dayLabels = conflictingDays.map(day => 
        DAYS_OF_WEEK.find(d => d.value === day)?.label
      ).filter(Boolean).join(', ');
      
      toast.error(`Time conflict detected for ${dayLabels}. Please adjust the time.`);
      return;
    }
    
    // Add individual slots for each selected day
    const newSlots: IndividualSlot[] = selectedDays.map(day => ({
      id: `${day}-${Date.now()}-${Math.random()}`,
      day: day,
      start_time: newSlotConfig.start_time,
      duration: newSlotConfig.slot_duration
    }));
    
    setIndividualSlots(prev => [...prev, ...newSlots]);
    
    // Also enable the days in working_days for compatibility
    setInterviewSettings(prev => ({
      ...prev,
      working_days: prev.working_days.map(day => 
        selectedDays.includes(day.day) 
          ? { 
              ...day, 
              enabled: true,
              start_time: newSlotConfig.start_time,
              end_time: '23:59', // Not used but required by interface
              slot_duration: newSlotConfig.slot_duration
            } 
          : day
      )
    }));
    
    // Reset selection
    setSelectedDays([]);
  };

  // Remove a specific individual slot
  const removeIndividualSlot = (slotId: string) => {
    setIndividualSlots(prev => prev.filter(slot => slot.id !== slotId));
  };
  
  // Remove all slots for a specific day
  const removeAllSlotsForDay = (dayValue: string) => {
    setIndividualSlots(prev => prev.filter(slot => slot.day !== dayValue));
    
    // Also disable the day in working_days for compatibility
    setInterviewSettings(prev => ({
      ...prev,
      working_days: prev.working_days.map(day => 
        day.day === dayValue ? { ...day, enabled: false, start_time: '09:00', end_time: '17:00', slot_duration: '30' } : day
      )
    }));
  };

  // Generate slots for preview
  const generateSlots = (): Slot[] => {
    const slots: Slot[] = [];
    const today = new Date();
    
    // Generate slots for the next 7 days
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
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
    }
    
    // Add break slots if any
    const todayString = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayBreaks = interviewSettings.breaks.filter(breakItem => breakItem.day === todayString);
    dayBreaks.forEach(breakItem => {
      slots.push({
        day: todayString,
        startTime: breakItem.start_time,
        endTime: breakItem.end_time,
        isBreak: true
      });
    });
    
    return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Get slots grouped by day for table display
  const getSlotsByDay = () => {
    const slots = generateSlots();
    const slotsByDay: Record<string, Slot[]> = {};
    
    DAYS_OF_WEEK.forEach(day => {
      slotsByDay[day.value] = slots.filter(slot => slot.day === day.value);
    });
    
    return slotsByDay;
  };

  const slotsByDay = getSlotsByDay();

  // Validate interview settings
  const validateSettings = (): boolean => {
    const newErrors: SettingsErrors = {};
    
    // Validate that at least one slot is configured
    if (individualSlots.length === 0) {
      newErrors.working_days = 'At least one time slot must be configured';
    }
    
    // Validate individual slots
    for (const slot of individualSlots) {
      if (!slot.start_time) {
        newErrors.working_days = `Start time is required for slot on ${slot.day}`;
      }
      
      if (!slot.duration || parseInt(slot.duration) <= 0) {
        newErrors.working_days = `Slot duration must be a positive number for slot on ${slot.day}`;
      }
    }
    
    // Check for conflicts between slots
    const daysWithSlots = [...new Set(individualSlots.map(slot => slot.day))];
    
    for (const day of daysWithSlots) {
      // Sort slots by start time for consistent conflict checking
      const daySlots = individualSlots
        .filter(slot => slot.day === day)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      // Check each pair of slots for conflicts
      for (let i = 0; i < daySlots.length; i++) {
        for (let j = i + 1; j < daySlots.length; j++) {
          const slot1 = daySlots[i];
          const slot2 = daySlots[j];
          
          if (doTimesOverlap(slot1.start_time, slot1.duration, slot2.start_time, slot2.duration)) {
            const dayLabel = DAYS_OF_WEEK.find(d => d.value === day)?.label || day;
            newErrors.working_days = `Conflicting time slots on ${dayLabel}. Please resolve overlaps.`;
            break;
          }
        }
        
        if (newErrors.working_days) break;
      }
      
      if (newErrors.working_days) break;
    }
    
    // Validate breaks
    for (const breakItem of interviewSettings.breaks) {
      const startHour = parseInt(breakItem.start_time.split(':')[0]);
      const endHour = parseInt(breakItem.end_time.split(':')[0]);
      
      if (startHour >= endHour) {
        newErrors.breaks = `Break start time must be before end time for ${breakItem.day}`;
      }
    }
    
    setSettingsErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save interview settings
  const handleSaveSettings = async () => {
    if (!schoolId || !validateSettings()) return;
    
    setSaving(true);
    const toastId = toast.loading('Saving interview settings...');
    
    try {
      // Prepare data to save, including individual slots as JSON
      const settingsToSave = {
        ...interviewSettings,
        slots: individualSlots // Save individual slots as JSON
      };
      
      // Call the mutation to save settings
      await updateMutation.mutateAsync({ schoolId, settings: settingsToSave });
      
      // Reset unsaved changes flag
      setHasUnsavedChanges(false);
      
      toast.success('Interview settings saved successfully!', { id: toastId });
    } catch (error) {
      console.error('Error saving interview settings:', error);
      toast.error('Failed to save interview settings. Please try again.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6 p-4 w-full">
        <div className="pb-4">
          <h3 className="text-lg font-medium">Meeting Settings</h3>
          <p className="text-sm text-muted-foreground">
            Control the default interview workflow for new job posts
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error loading interview settings: {error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 w-full">
        <div className="pb-4">
          <h3 className="text-lg font-medium">Meeting Settings</h3>
          <p className="text-sm text-muted-foreground">
            Control the default interview workflow for new job posts
          </p>
        </div>
        
        {/* Interview Type & Duration Section - Loading */}
        <div className="space-y-4">
          <h4 className="font-medium text-base border-b pb-2 px-4 -mx-4">Interview Type & Duration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 w-full">
            <div className="space-y-2 w-full">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
            </div>
            
            <div className="space-y-2 w-full">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Scheduling Window Section - Loading */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-base">Scheduling Window</h4>
          </div>
          <div className="border-b  px-4 -mx-4"></div>
          <div className="space-y-6 pt-2 w-full">
            <div className="space-y-4">
              {/* Add New Slot Form - Loading */}
              <div className="border rounded-lg p-4">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Existing Slot Configurations - Loading */}
              <div className="space-y-3">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Reminders & Instructions Section - Loading */}
        <div className="space-y-4">
          <h4 className="font-medium text-base border-b pb-2 px-4 -mx-4">Reminders & Instructions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 w-full">
            <div className="space-y-2 w-full">
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
            </div>
            
            <div className="space-y-2 w-full">
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-2 pt-4 w-full">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-20 bg-gray-200 rounded-md animate-pulse" />
          </div>
        </div>
        
        {/* Save Button - Loading */}
        <div className="flex justify-end pt-4 w-full">
          <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 w-full">
      <div className="pb-4">
        <h3 className="text-lg font-medium">Meeting Settings</h3>
        <p className="text-sm text-muted-foreground">
          Control the default interview workflow for new job posts
        </p>
      </div>
      
      <div className="space-y-8 w-full">
        {/* Interview Type & Duration Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-base border-b pb-2 px-4 -mx-4">Interview Type & Duration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 w-full">
            <div className="space-y-2 w-full">
              <Label htmlFor="default_interview_type">Default Interview Type</Label>
              <Select 
                value={interviewSettings.default_interview_type} 
                onValueChange={(value) => handleSettingsChange('default_interview_type', value as unknown as string)}
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
            
            <div className="space-y-2 w-full">
              <Label htmlFor="default_duration">Default Interview Duration (minutes)</Label>
              <Input
                id="default_duration"
                type="number"
                min="1"
                value={interviewSettings.default_duration}
                onChange={(e) => handleSettingsChange('default_duration', e.target.value)}
                className={`w-full ${settingsErrors.default_duration ? 'border-red-500' : ''}`}
              />
              {settingsErrors.default_duration && (
                <p className="text-sm text-red-600">{settingsErrors.default_duration}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Scheduling Window Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-base">Scheduling Window</h4>
            <div className="flex justify-end items-center">
              <SlotPreviewDialog 
                isOpen={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
                slotsByDay={slotsByDay}
                workingDays={interviewSettings.working_days}
                daysOfWeek={DAYS_OF_WEEK}
              />
            </div>
          </div>
          <div className="border-b  px-4 -mx-4"></div>
          <div className="space-y-6 pt-2 w-full">
            <div className="space-y-4">
                {/* Add New Slot Form */}
                <div className="border rounded-lg p-4">
                  <h6 className="font-medium mb-4">Create Specific Time Slots</h6>
                  <p className="text-sm text-gray-600 mb-4">Create individual time slots for specific days. Each slot will be available for scheduling interviews.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="slot-start-time">Start Time</Label>
                      <Input
                        id="slot-start-time"
                        type="time"
                        value={newSlotConfig.start_time}
                        onChange={(e) => setNewSlotConfig(prev => ({ ...prev, start_time: e.target.value }))}
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
                        onChange={(e) => setNewSlotConfig(prev => ({ ...prev, slot_duration: e.target.value }))}
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
                      {DAYS_OF_WEEK.map((day) => {
                        // Check if adding a slot for this day would cause a conflict
                        // Sort existing slots by start time for consistent conflict checking
                        const existingDaySlots = individualSlots
                          .filter(slot => slot.day === day.value)
                          .sort((a, b) => a.start_time.localeCompare(b.start_time));
                        
                        const hasConflict = selectedDays.includes(day.value) && 
                          existingDaySlots
                            .some(slot => 
                              doTimesOverlap(
                                slot.start_time, 
                                slot.duration, 
                                newSlotConfig.start_time, 
                                newSlotConfig.slot_duration
                              )
                            );
                        
                        return (
                          <div 
                            key={day.value} 
                            className={`flex items-center space-x-2 border rounded p-2 cursor-pointer ${
                              selectedDays.includes(day.value) 
                                ? hasConflict 
                                  ? 'bg-red-50 border-red-300' 
                                  : 'bg-blue-50 border-blue-300'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              if (selectedDays.includes(day.value)) {
                                setSelectedDays((prev: string[]) => prev.filter((d: string) => d !== day.value));
                              } else {
                                setSelectedDays((prev: string[]) => [...prev, day.value]);
                              }
                            }}
                          >
                            <Checkbox
                              id={`select-${day.value}`}
                              checked={selectedDays.includes(day.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDays((prev: string[]) => [...prev, day.value]);
                                } else {
                                  setSelectedDays((prev: string[]) => prev.filter((d: string) => d !== day.value));
                                }
                              }}
                              className="pointer-events-none"
                            />
                            <Label htmlFor={`select-${day.value}`} className="text-sm cursor-pointer">
                              {day.label}
                              {hasConflict && (
                                <span className="text-red-500 ml-1">⚠️</span>
                              )}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Existing Slot Configurations - Calendar View */}
                <div className="space-y-3">
                  <h6 className="font-medium">Configured Slots</h6>
                  <div className="border rounded-lg overflow-hidden">
                    {/* Generate time-based grid */}
                    {(() => {
                      // Sort slots by start time to ensure proper display order
                      const sortedSlots = [...individualSlots].sort((a, b) => {
                        const [aHours, aMinutes] = a.start_time.split(':').map(Number);
                        const [bHours, bMinutes] = b.start_time.split(':').map(Number);
                        const aTotalMinutes = aHours * 60 + aMinutes;
                        const bTotalMinutes = bHours * 60 + bMinutes;
                        return aTotalMinutes - bTotalMinutes;
                      });
                      
                      // Display all days of the week by default
                      const displayedDays = DAYS_OF_WEEK;
                      
                      // Determine the time range based on configured slots
                      if (sortedSlots.length === 0) {
                        return (
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                {displayedDays.map(day => (
                                  <th key={day.value} className="text-center p-2 text-sm font-medium">
                                    {day.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td colSpan={displayedDays.length} className="text-center p-4 text-muted-foreground">
                                  No slots configured yet. Add time slots above.
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        );
                      }
                      
                      // Find min and max times to create the grid
                      const startTimes = sortedSlots.map(slot => {
                        const [hours, minutes] = slot.start_time.split(':').map(Number);
                        return hours * 60 + minutes;
                      });
                      
                      const minTime = Math.min(...startTimes);
                      const maxTime = Math.max(...startTimes.map(time => {
                        // Add duration to get end time
                        const slot = sortedSlots.find(s => {
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
                      
                      return (
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              {displayedDays.map(day => (
                                <th key={day.value} className="text-center p-2 text-sm font-medium">
                                  {day.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {timeSlots.map((time, index) => (
                              <tr key={time} className="border-b" style={{ height: `${baseHeight}rem` }}>
                                {displayedDays.map(day => {
                                  const cellKey = `${time}-${day.value}`;
                                  
                                  // Check if this cell is occupied by a slot
                                  if (cellOccupancy[cellKey]) {
                                    return <td key={cellKey} className="p-1 align-middle"></td>;
                                  }
                                  
                                  // Find slot that starts at this time
                                  const slot = sortedSlots.find(s => 
                                    s.day === day.value && s.start_time === time
                                  );
                                  
                                  if (slot) {
                                    // Calculate how many time slots this slot spans
                                    const duration = parseInt(slot.duration);
                                    const span = Math.ceil(duration / 30);
                                    const height = span * baseHeight;
                                    
                                    // Mark cells that this slot occupies
                                    for (let i = 0; i < span; i++) {
                                      if (index + i < timeSlots.length) {
                                        cellOccupancy[`${timeSlots[index + i]}-${day.value}`] = true;
                                      }
                                    }
                                    
                                    // Calculate end time for display
                                    const [startHours, startMinutes] = slot.start_time.split(':').map(Number);
                                    const startTotalMinutes = startHours * 60 + startMinutes;
                                    const endTotalMinutes = startTotalMinutes + duration;
                                    
                                    const endHours = Math.floor(endTotalMinutes / 60);
                                    const endMinutes = endTotalMinutes % 60;
                                    
                                    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
                                    
                                    return (
                                      <td 
                                        key={cellKey} 
                                        className="p-1 align-middle relative" 
                                        rowSpan={span}
                                      >
                                        <div className="relative h-full flex items-center justify-center">
                                          <div 
                                            className="p-2 rounded text-sm bg-green-100 border border-green-300 w-full flex flex-col justify-center"
                                            style={{ height: `${height}rem` }}
                                          >
                                            <div className="font-mono text-center">
                                              {slot.start_time} - {endTime}
                                            </div>
                                            <div className="text-xs text-gray-600 text-center mt-1">
                                              {slot.duration} min
                                            </div>
                                          </div>
                                          <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => removeIndividualSlot(slot.id)}
                                            className="absolute -top-2 -right-2 h-5 w-5 bg-white rounded-full shadow"
                                          >
                                            <X className="h-3 w-3" />
                                            <span className="sr-only">Remove slot at {slot.start_time} on {day.label}</span>
                                          </Button>
                                        </div>
                                      </td>
                                    );
                                  }
                                  
                                  return (
                                    <td key={cellKey} className="p-1 align-middle">
                                      <div className="h-full w-full"></div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                  
                  {individualSlots.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No slots configured yet. Add time slots above.</p>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Reminders & Instructions Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-base border-b pb-2 px-4 -mx-4">Reminders & Instructions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 w-full">
            <div className="space-y-2 w-full">
              <Label htmlFor="candidate_reminder_hours">Send Reminder to Candidate (hours before)</Label>
              <Input
                id="candidate_reminder_hours"
                type="number"
                min="0"
                value={interviewSettings.candidate_reminder_hours}
                onChange={(e) => handleSettingsChange('candidate_reminder_hours', e.target.value)}
                className={`w-full ${settingsErrors.candidate_reminder_hours ? 'border-red-500' : ''}`}
              />
              {settingsErrors.candidate_reminder_hours && (
                <p className="text-sm text-red-600">{settingsErrors.candidate_reminder_hours}</p>
              )}
            </div>
            
            <div className="space-y-2 w-full">
              <Label htmlFor="interviewer_reminder_hours">Send Reminder to Interviewer (hours before)</Label>
              <Input
                id="interviewer_reminder_hours"
                type="number"
                min="0"
                value={interviewSettings.interviewer_reminder_hours}
                onChange={(e) => handleSettingsChange('interviewer_reminder_hours', e.target.value)}
                className={`w-full ${settingsErrors.interviewer_reminder_hours ? 'border-red-500' : ''}`}
              />
              {settingsErrors.interviewer_reminder_hours && (
                <p className="text-sm text-red-600">{settingsErrors.interviewer_reminder_hours}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2 pt-4 w-full">
            <Label htmlFor="custom_instructions">Custom Instructions</Label>
            <Textarea
              id="custom_instructions"
              placeholder="Message shown to candidate before interview"
              value={interviewSettings.custom_instructions}
              onChange={(e) => handleSettingsChange('custom_instructions', e.target.value)}
              rows={4}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              This message will be shown to candidates before their interview
            </p>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end pt-4 w-full">
          <Button onClick={handleSaveSettings} disabled={saving || updateMutation.isPending} className="w-full md:w-auto">
            {saving || updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
      </div>
      <UnsavedChangesDialog 
        open={showUnsavedChangesDialog}
        onOpenChange={setShowUnsavedChangesDialog}
        onConfirm={() => {
          setHasUnsavedChanges(false);
          setShowUnsavedChangesDialog(false);
          // Handle actual navigation here if needed
          if (pendingNavigation) {
            // Perform the pending navigation
            setPendingNavigation(false);
          }
          // Call the onNavigateAway callback if provided
          if (onNavigateAway) {
            onNavigateAway();
          }
        }}
        onCancel={() => {
          setShowUnsavedChangesDialog(false);
          setPendingNavigation(false);
        }}
      />
    </div>
  );
}