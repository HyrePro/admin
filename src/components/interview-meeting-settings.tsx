'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from '@/lib/supabase/api/client';
import { toast } from "sonner";
import { SlotPreviewDialog } from "@/components/slot-preview-dialog";

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
}

interface SettingsErrors extends Partial<InterviewSettingsData> {
  working_days?: string;
  breaks?: string;
}

interface InterviewMeetingSettingsProps {
  schoolId: string;
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

export function InterviewMeetingSettings({ schoolId }: InterviewMeetingSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Interview settings state
  const [interviewSettings, setInterviewSettings] = useState<ExtendedInterviewSettings>({
    default_interview_type: 'in-person',
    default_duration: '30',
    buffer_time: '15',
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    candidate_reminder_hours: '24',
    interviewer_reminder_hours: '1',
    custom_instructions: 'Please arrive 10 minutes early for your interview.',
    working_days: DAYS_OF_WEEK.map(day => ({
      day: day.value,
      enabled: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day.value),
      start_time: '09:00',
      end_time: '17:00',
      slot_duration: '30' // Default slot duration of 30 minutes
    })),
    breaks: []
  });
  
  const [settingsErrors, setSettingsErrors] = useState<SettingsErrors>({});

  // Fetch interview settings from Supabase
  useEffect(() => {
    const fetchInterviewSettings = async () => {
      if (!schoolId) return;
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('school_info')
          .select('interview_settings')
          .eq('id', schoolId)
          .single();
        
        if (error) throw error;
        
        if (data?.interview_settings) {
          setInterviewSettings(prev => ({
            ...prev,
            ...data.interview_settings,
            working_days: data.interview_settings.working_days || prev.working_days,
            breaks: data.interview_settings.breaks || prev.breaks
          }));
        }
      } catch (error) {
        console.error('Error fetching interview settings:', error);
        // Not showing error to user as this is optional
      }
    };
    
    if (schoolId) {
      fetchInterviewSettings();
    }
  }, [schoolId]);

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

  // Generate slots for preview
  const generateSlots = (): Slot[] => {
    const slots: Slot[] = [];
    const today = new Date();
    
    // Generate slots for the next 7 days
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
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

  // Validate interview settings
  const validateSettings = (): boolean => {
    const newErrors: SettingsErrors = {};
    
    if (!interviewSettings.default_duration || parseInt(interviewSettings.default_duration) <= 0) {
      newErrors.default_duration = 'Duration must be a positive number';
    }
    
    if (!interviewSettings.buffer_time || parseInt(interviewSettings.buffer_time) < 0) {
      newErrors.buffer_time = 'Buffer time must be a non-negative number';
    }
    
    if (!interviewSettings.candidate_reminder_hours || parseInt(interviewSettings.candidate_reminder_hours) < 0) {
      newErrors.candidate_reminder_hours = 'Reminder hours must be a non-negative number';
    }
    
    if (!interviewSettings.interviewer_reminder_hours || parseInt(interviewSettings.interviewer_reminder_hours) < 0) {
      newErrors.interviewer_reminder_hours = 'Reminder hours must be a non-negative number';
    }
    
    // Validate that at least one working day is enabled
    const enabledDays = interviewSettings.working_days.filter(day => day.enabled);
    if (enabledDays.length === 0) {
      newErrors.working_days = 'At least one working day must be enabled';
    }
    
    // Validate working days
    for (const day of interviewSettings.working_days) {
      if (day.enabled) {
        const startHour = parseInt(day.start_time.split(':')[0]);
        const endHour = parseInt(day.end_time.split(':')[0]);
        
        if (startHour >= endHour) {
          newErrors.working_days = `Start time must be before end time for ${day.day}`;
        }
        
        if (!day.slot_duration || parseInt(day.slot_duration) <= 0) {
          newErrors.working_days = `Slot duration must be a positive number for ${day.day}`;
        }
      }
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
      const supabase = createClient();
      
      // Update school info with interview settings
      const { error } = await supabase
        .from('school_info')
        .update({ interview_settings: interviewSettings })
        .eq('id', schoolId);
      
      if (error) throw error;
      
      toast.success('Interview settings saved successfully!', { id: toastId });
    } catch (error) {
      console.error('Error saving interview settings:', error);
      toast.error('Failed to save interview settings. Please try again.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const slotsByDay = getSlotsByDay();

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
          <h4 className="font-medium text-base border-b pb-2 px-4 -mx-4">Scheduling Window</h4>
          <div className="space-y-6 pt-2 w-full">
            {/* Working Days */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="font-medium">Working Days</h5>
                <SlotPreviewDialog 
                  isOpen={isPreviewOpen}
                  onOpenChange={setIsPreviewOpen}
                  slotsByDay={slotsByDay}
                  workingDays={interviewSettings.working_days}
                  daysOfWeek={DAYS_OF_WEEK}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {interviewSettings.working_days.map((day) => (
                  <div key={day.day} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Checkbox
                        id={`day-${day.day}`}
                        checked={day.enabled}
                        onCheckedChange={(checked) => handleWorkingDayChange(day.day, 'enabled', checked as boolean)}
                      />
                      <Label htmlFor={`day-${day.day}`} className="flex-1 font-medium">
                        {DAYS_OF_WEEK.find(d => d.value === day.day)?.label}
                      </Label>
                    </div>
                    
                    {day.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2">
                        <div className="space-y-2">
                          <Label htmlFor={`start-${day.day}`}>Start Time</Label>
                          <Input
                            id={`start-${day.day}`}
                            type="time"
                            value={day.start_time}
                            onChange={(e) => handleWorkingDayChange(day.day, 'start_time', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`end-${day.day}`}>End Time</Label>
                          <Input
                            id={`end-${day.day}`}
                            type="time"
                            value={day.end_time}
                            onChange={(e) => handleWorkingDayChange(day.day, 'end_time', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`duration-${day.day}`}>Slot Duration (min)</Label>
                          <Input
                            id={`duration-${day.day}`}
                            type="number"
                            min="15"
                            step="15"
                            value={day.slot_duration}
                            onChange={(e) => handleWorkingDayChange(day.day, 'slot_duration', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2 flex items-end">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addBreak(day.day)}
                            className="w-full"
                          >
                            Add Break
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {day.enabled && interviewSettings.breaks.filter(b => b.day === day.day).length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h6 className="text-sm font-medium">Breaks</h6>
                        {interviewSettings.breaks
                          .filter(breakItem => breakItem.day === day.day)
                          .map(breakItem => (
                            <div key={breakItem.id} className="flex items-center space-x-2 p-2 bg-orange-50 rounded">
                              <Input
                                type="time"
                                value={breakItem.start_time}
                                onChange={(e) => handleBreakChange(breakItem.id, 'start_time', e.target.value)}
                                className="w-24"
                              />
                              <span>to</span>
                              <Input
                                type="time"
                                value={breakItem.end_time}
                                onChange={(e) => handleBreakChange(breakItem.id, 'end_time', e.target.value)}
                                className="w-24"
                              />
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => removeBreak(breakItem.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {settingsErrors.working_days && (
                <p className="text-sm text-red-600">{settingsErrors.working_days}</p>
              )}
            </div>
            
            {/* Buffer Time */}
            <div className="space-y-2">
              <Label htmlFor="buffer_time">Buffer Between Interviews (minutes)</Label>
              <Input
                id="buffer_time"
                type="number"
                min="0"
                value={interviewSettings.buffer_time}
                onChange={(e) => handleSettingsChange('buffer_time', e.target.value)}
                className={`w-full md:w-1/3 ${settingsErrors.buffer_time ? 'border-red-500' : ''}`}
              />
              {settingsErrors.buffer_time && (
                <p className="text-sm text-red-600">{settingsErrors.buffer_time}</p>
              )}
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
          <Button onClick={handleSaveSettings} disabled={saving} className="w-full md:w-auto">
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}