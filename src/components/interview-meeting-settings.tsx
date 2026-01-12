'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Clock, Calendar, Bell, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
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
  slot_duration: string;
}

interface BreakPeriod {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
}

interface IndividualSlot {
  id: string;
  day: string;
  start_time: string;
  duration: string;
}

interface ExtendedInterviewSettings extends InterviewSettingsData {
  working_days: WorkingDay[];
  breaks: BreakPeriod[];
  slots?: IndividualSlot[];
}

interface InterviewMeetingSettingsProps {
  schoolId: string;
  onNavigateAway?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon', full: 'Monday' },
  { value: 'tuesday', label: 'Tue', full: 'Tuesday' },
  { value: 'wednesday', label: 'Wed', full: 'Wednesday' },
  { value: 'thursday', label: 'Thu', full: 'Thursday' },
  { value: 'friday', label: 'Fri', full: 'Friday' },
  { value: 'saturday', label: 'Sat', full: 'Saturday' },
  { value: 'sunday', label: 'Sun', full: 'Sunday' },
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
  const queryClient = useQueryClient();
  
  const { data: fetchedSettings, isLoading, error } = useQuery({
    queryKey: ['settings', 'interviews', schoolId],
    queryFn: () => fetchInterviewSettings(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
  
  const updateMutation = useMutation({
    mutationFn: updateInterviewSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'interviews', schoolId] });
      toast.success('Interview settings updated successfully!');
      setHasUnsavedChanges(false);
    },
    onError: (error: Error) => {
      toast.error(`Error saving interview settings: ${error.message}`);
    }
  });

  const [interviewSettings, setInterviewSettings] = useState<ExtendedInterviewSettings>({
    default_interview_type: 'in-person',
    default_duration: '30',
    buffer_time: '0',
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    candidate_reminder_hours: '24',
    interviewer_reminder_hours: '2',
    custom_instructions: '',
    working_days: DAYS_OF_WEEK.map(day => ({
      day: day.value,
      enabled: false,
      start_time: '09:00',
      end_time: '17:00',
      slot_duration: '30'
    })),
    breaks: [],
    slots: []
  });

  const [individualSlots, setIndividualSlots] = useState<IndividualSlot[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [newSlotConfig, setNewSlotConfig] = useState({
    start_time: '09:00',
    slot_duration: '30'
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (fetchedSettings) {
      setInterviewSettings(fetchedSettings);
      const slotsToSet = fetchedSettings.slots && Array.isArray(fetchedSettings.slots) ? fetchedSettings.slots : [];
      setIndividualSlots(slotsToSet);
    }
  }, [fetchedSettings]);

  useEffect(() => {
    if (individualSlots.length > 0 && fetchedSettings) {
      setHasUnsavedChanges(true);
    }
  }, [individualSlots, fetchedSettings]);

  const handleSettingsChange = (field: keyof ExtendedInterviewSettings, value: any) => {
    setInterviewSettings(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const doTimesOverlap = (start1: string, duration1: string, start2: string, duration2: string): boolean => {
    const [hours1, minutes1] = start1.split(':').map(Number);
    const [hours2, minutes2] = start2.split(':').map(Number);
    
    const startMinutes1 = hours1 * 60 + minutes1;
    const endMinutes1 = startMinutes1 + parseInt(duration1);
    
    const startMinutes2 = hours2 * 60 + minutes2;
    const endMinutes2 = startMinutes2 + parseInt(duration2);
    
    return startMinutes1 < endMinutes2 && startMinutes2 < endMinutes1;
  };

  const addSlotConfiguration = () => {
    if (selectedDays.length === 0) return;
    
    const conflictingDays: string[] = [];
    
    selectedDays.forEach(day => {
      const existingSlots = individualSlots.filter(slot => slot.day === day);
      const hasConflict = existingSlots.some(slot => 
        doTimesOverlap(slot.start_time, slot.duration, newSlotConfig.start_time, newSlotConfig.slot_duration)
      );
      
      if (hasConflict) {
        conflictingDays.push(day);
      }
    });
    
    if (conflictingDays.length > 0) {
      const dayLabels = conflictingDays.map(day => 
        DAYS_OF_WEEK.find(d => d.value === day)?.label
      ).filter(Boolean).join(', ');
      toast.error(`Time conflict detected for ${dayLabels}. Please adjust the time.`);
      return;
    }
    
    const newSlots: IndividualSlot[] = selectedDays.map(day => ({
      id: `${day}-${Date.now()}-${Math.random()}`,
      day: day,
      start_time: newSlotConfig.start_time,
      duration: newSlotConfig.slot_duration
    }));
    
    setIndividualSlots(prev => [...prev, ...newSlots]);
    setSelectedDays([]);
    setHasUnsavedChanges(true);
  };

  const removeIndividualSlot = (slotId: string) => {
    setIndividualSlots(prev => prev.filter(slot => slot.id !== slotId));
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    if (!schoolId) return;
    
    const settingsToSave = {
      ...interviewSettings,
      slots: individualSlots
    };
    
    await updateMutation.mutateAsync({ schoolId, settings: settingsToSave });
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }
    
    if (fetchedSettings) {
      setInterviewSettings(fetchedSettings);
      const slotsToSet = fetchedSettings.slots && Array.isArray(fetchedSettings.slots) ? fetchedSettings.slots : [];
      setIndividualSlots(slotsToSet);
      setHasUnsavedChanges(false);
    }
    
    if (onNavigateAway) {
      onNavigateAway();
    }
  };

  const getSlotsByDay = () => {
    const slotsByDay: Record<string, IndividualSlot[]> = {};
    DAYS_OF_WEEK.forEach(day => {
      slotsByDay[day.value] = individualSlots
        .filter(slot => slot.day === day.value)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return slotsByDay;
  };

  const slotsByDay = getSlotsByDay();

  const formatTime = (time: string, duration: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + parseInt(duration);
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${time} - ${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Error loading interview settings. Please try again.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Meeting Settings</h2>
          <p className="text-xs text-gray-600 mt-0.5">Configure interview scheduling and notifications</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCancel}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            size="sm"
            onClick={handleSaveSettings}
            disabled={updateMutation.isPending || !hasUnsavedChanges}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Interview Basics */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Interview Basics</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="interview-type" className="text-xs font-medium text-gray-700">
                Interview Type
              </Label>
              <Select 
                value={interviewSettings.default_interview_type}
                onValueChange={(value) => handleSettingsChange('default_interview_type', value)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-person">In-person</SelectItem>
                  <SelectItem value="online">Online (Meet/Zoom)</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="duration" className="text-xs font-medium text-gray-700">
                Duration (minutes)
              </Label>
              <Input
                id="duration"
                type="number"
                min="15"
                step="15"
                className="h-9 text-sm"
                value={interviewSettings.default_duration}
                onChange={(e) => handleSettingsChange('default_duration', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Available Time Slots */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Available Time Slots</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Add New Slots */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="text-xs font-semibold text-gray-900 mb-3">Add Time Slots</h4>
            
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Start Time</Label>
                  <Input
                    type="time"
                    className="h-9 text-sm"
                    value={newSlotConfig.start_time}
                    onChange={(e) => setNewSlotConfig(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Duration</Label>
                  <Select
                    value={newSlotConfig.slot_duration}
                    onValueChange={(value) => setNewSlotConfig(prev => ({ ...prev, slot_duration: value }))}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Select Days</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = selectedDays.includes(day.value);
                    const existingSlots = individualSlots.filter(slot => slot.day === day.value);
                    const hasConflict = isSelected && existingSlots.some(slot => 
                      doTimesOverlap(slot.start_time, slot.duration, newSlotConfig.start_time, newSlotConfig.slot_duration)
                    );

                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          setSelectedDays(prev => 
                            prev.includes(day.value) 
                              ? prev.filter(d => d !== day.value)
                              : [...prev, day.value]
                          );
                        }}
                        className={`
                          p-2 rounded-md border text-xs font-medium transition-colors text-center
                          ${isSelected 
                            ? hasConflict
                              ? 'bg-red-50 border-red-300 text-red-700'
                              : 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button 
                onClick={addSlotConfiguration}
                disabled={selectedDays.length === 0}
                size="sm"
                className="w-full"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Add Time Slots
              </Button>
            </div>
          </div>

          {/* Configured Slots */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-900">Configured Slots</h4>

            {Object.values(slotsByDay).flat().length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">
                No time slots configured. Add slots above to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {DAYS_OF_WEEK.map(day => {
                  const slots = slotsByDay[day.value];
                  if (slots.length === 0) return null;

                  return (
                    <div key={day.value} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-semibold text-gray-900">{day.full}</h5>
                          <span className="text-xs text-gray-500">
                            {slots.length} slot{slots.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="p-2 space-y-2">
                        {slots.map(slot => (
                          <div 
                            key={slot.id}
                            className="flex items-center justify-between p-2.5 bg-gray-50 rounded-md group hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              <div>
                                <div className="text-xs font-medium text-gray-900">
                                  {formatTime(slot.start_time, slot.duration)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {slot.duration} minutes
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeIndividualSlot(slot.id)}
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reminders & Instructions */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Reminders & Instructions</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">
                Candidate Reminder (hours before)
              </Label>
              <Input
                type="number"
                min="0"
                className="h-9 text-sm"
                value={interviewSettings.candidate_reminder_hours}
                onChange={(e) => handleSettingsChange('candidate_reminder_hours', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">
                Interviewer Reminder (hours before)
              </Label>
              <Input
                type="number"
                min="0"
                className="h-9 text-sm"
                value={interviewSettings.interviewer_reminder_hours}
                onChange={(e) => handleSettingsChange('interviewer_reminder_hours', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">
              Custom Instructions
            </Label>
            <Textarea
              placeholder="Enter custom instructions for candidates..."
              value={interviewSettings.custom_instructions}
              onChange={(e) => handleSettingsChange('custom_instructions', e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
            <p className="text-xs text-gray-500">
              These instructions will be shown to candidates before their interview
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}