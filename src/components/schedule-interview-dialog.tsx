"use client";
import { createPortal } from "react-dom";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Mail, 
  Briefcase, 
  Monitor, 
  Building,
  Link as LinkIcon,
  X,
  UserPlus,
  Video,
  Mic,
  Phone,
  Loader2,
  Copy,
  Check,
  GlobeLock,
  CheckCircle2,
  CircleAlert,
  Info
} from "lucide-react";
import { createClient } from '@/lib/supabase/api/client';
import { useAuthStore } from '@/store/auth-store';
import { useAuth } from '@/context/auth-context';
import { toast } from "sonner";
import PanelistAutocomplete from "./PanelistAutocomplete";
import { usePanelistAvailability } from '@/hooks/usePanelistAvailability';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface Candidate {
    application_id: string;
    first_name: string;
    last_name: string;
    email: string;
    job_title: string;
    created_at: string;
    job_id: string;
}

interface Panelist {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

interface SavedPanelist {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

interface PreferredSlot {
  id: string;
  day: string;
  duration: string;
  start_time: string;
}

interface SchoolInfo {
  id: string;
  name: string;
  address: string;
  location: string;
}

interface ScheduleInterviewForm {
  date: string;
  time: string;
  duration: string;
  meetingType: "offline" | "online";
  meetingPlatform: "google" | "";
  location: string;
  panelists: string;
  notes: string;
}

interface ScheduleInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  onClose: () => void;
}

export function ScheduleInterviewDialog({ 
  open, 
  onOpenChange,
  candidate,
  onClose
}: ScheduleInterviewDialogProps) {

  const { user } = useAuth();
  const { schoolId: storeSchoolId } = useAuthStore();
  const [schoolId, setSchoolId] = useState<string | null>(storeSchoolId);
  const [copied, setCopied] = useState(false);
  
  const getNext30MinInterval = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    
    if (minutes > 30) {
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
    } else {
      now.setMinutes(30);
    }
    
    now.setSeconds(0);
    now.setMilliseconds(0);
    
    const date = now.toISOString().split('T')[0];
    const hours = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${mins}`;
    
    return { date, time };
  };

  const [scheduleForm, setScheduleForm] = useState<ScheduleInterviewForm>({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: '60',
    meetingType: 'online',
    meetingPlatform: 'google',
    location: '',
    panelists: '',
    notes: ''
  });
  
  const [preferredSlots, setPreferredSlots] = useState<PreferredSlot[]>([]);
  const [selectedPreferredSlot, setSelectedPreferredSlot] = useState<PreferredSlot | null>(null);
  const [savedPanelists, setSavedPanelists] = useState<SavedPanelist[]>([]);
  const [selectedPanelists, setSelectedPanelists] = useState<Panelist[]>([]);
  useEffect(() => {
    console.log('Selected panelists changed:', selectedPanelists.length, selectedPanelists);
  }, [selectedPanelists]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Panelist display component
  const PanelistDisplay = ({ 
    panelist, 
    scheduleForm, 
    onRemove 
  }: { 
    panelist: Panelist; 
    scheduleForm: ScheduleInterviewForm; 
    onRemove: (email: string) => void;
  }) => {
    // Calculate end time based on start time and duration
    const [hours, minutes] = scheduleForm.time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + parseInt(scheduleForm.duration);
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

    const { data: availabilityData, isLoading, isError } = usePanelistAvailability({
      panelistEmail: panelist.email,
      interviewDate: scheduleForm.date,
      startTime: scheduleForm.time,
      endTime,
      enabled: Boolean(scheduleForm.date && scheduleForm.time && scheduleForm.duration)
    });

    // Determine availability status
    let availabilityStatus: 'available' | 'unavailable' | 'checking' | 'error' = 'checking';
    if (isLoading) {
      availabilityStatus = 'checking';
    } else if (isError) {
      availabilityStatus = 'error';
    } else if (availabilityData) {
      const hasConflict = availabilityData.some(item => item.is_available === false);
      availabilityStatus = hasConflict ? 'unavailable' : 'available';
    }

    return (
      <div 
        className="flex items-center justify-between bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs relative"
      >
        {panelist.avatar ? (
          <img 
            src={panelist.avatar} 
            alt={`${panelist.first_name || ''} ${panelist.last_name || ''}`}
            className="w-5 h-5 rounded-full object-cover"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-[10px] font-medium">
            {panelist.first_name && panelist.last_name 
              ? `${(panelist.first_name || '').charAt(0)}${(panelist.last_name || '').charAt(0)}`
              : (panelist.email || '').charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-slate-700 font-medium">{panelist.email}</span>
        <div className="ml-1">
          {availabilityStatus === 'checking' && (
            <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
          )}
          {availabilityStatus === 'available' && (
            <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-600 text-white" />
          )}
          {availabilityStatus === 'unavailable' && (
            <HoverCard>
              <HoverCardTrigger>
                <CircleAlert className="w-3 h-3 text-red-600" />
              </HoverCardTrigger>
              <HoverCardContent className="max-w-xs p-3 bg-white text-slate-800 text-xs border shadow-lg">
                <div className="space-y-3">
                  <p className="font-semibold text-red-600 text-sm">Conflicts Detected!</p>
                  {availabilityData && availabilityData
                    .filter(item => item.is_available === false)
                    .map((conflict, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">{conflict.job_id || 'Job ID N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span>{conflict.conflict_start_time} - {conflict.conflict_end_time}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="truncate">{conflict.candidate_email}</span>
                        </div>
                        <div className="text-xs px-2 py-1 bg-slate-200 rounded inline-block">
                          {conflict.interview_status}
                        </div>
                      </div>
                    ))}
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
          {availabilityStatus === 'error' && (
            <X className="w-3 h-3 text-yellow-600" />
          )}
        </div>
        <button 
          type="button"
          onClick={() => onRemove(panelist.email)}
          className="text-slate-400 hover:text-slate-600 transition-colors ml-1"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  };

  // Panelist preview display component
  const PanelistPreviewDisplay = ({ 
    panelist, 
    scheduleForm 
  }: { 
    panelist: Panelist; 
    scheduleForm: ScheduleInterviewForm; 
  }) => {
    // Calculate end time based on start time and duration
    const [hours, minutes] = scheduleForm.time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + parseInt(scheduleForm.duration);
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

    const { data: availabilityData, isLoading, isError } = usePanelistAvailability({
      panelistEmail: panelist.email,
      interviewDate: scheduleForm.date,
      startTime: scheduleForm.time,
      endTime,
      enabled: Boolean(scheduleForm.date && scheduleForm.time && scheduleForm.duration)
    });

    // Determine availability status
    let availabilityStatus: 'available' | 'unavailable' | 'checking' | 'error' = 'checking';
    if (isLoading) {
      availabilityStatus = 'checking';
    } else if (isError) {
      availabilityStatus = 'error';
    } else if (availabilityData) {
      const hasConflict = availabilityData.some(item => item.is_available === false);
      availabilityStatus = hasConflict ? 'unavailable' : 'available';
    }

    return (
      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-2">
          {panelist.avatar ? (
          <img 
            src={panelist.avatar} 
            className="w-7 h-7 rounded-full object-cover"
            alt=""
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-xs font-medium">
            {panelist.first_name && panelist.last_name 
              ? `${(panelist.first_name || '').charAt(0)}${(panelist.last_name || '').charAt(0)}`
              : (panelist.email || '').charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm text-slate-700 truncate">{panelist.email}</span>
        </div>
        <div className="ml-1">
          {availabilityStatus === 'checking' && (
            <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
          )}
          {availabilityStatus === 'available' && (
            <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-600 text-white" />
          )}
          {availabilityStatus === 'unavailable' && (
            <HoverCard>
              <HoverCardTrigger>
                <CircleAlert className="w-3 h-3 text-red-600" />
              </HoverCardTrigger>
              <HoverCardContent className="max-w-xs p-3 bg-white text-slate-800 text-xs border shadow-lg">
                <div className="space-y-3">
                  <p className="font-semibold text-red-600 text-sm">Conflicts Detected!</p>
                  {availabilityData && availabilityData
                    .filter(item => item.is_available === false)
                    .map((conflict, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">{conflict.job_id || 'Job ID N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span>{conflict.conflict_start_time} - {conflict.conflict_end_time}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="truncate">{conflict.candidate_email}</span>
                        </div>
                        <div className="text-xs px-2 py-1 bg-slate-200 rounded inline-block">
                          {conflict.interview_status}
                        </div>
                      </div>
                    ))}
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
          {availabilityStatus === 'error' && (
            <X className="w-3 h-3 text-yellow-600" />
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchSchoolId = async () => {
      if (storeSchoolId) {
        setSchoolId(storeSchoolId);
        return;
      }
      
      if (!user?.id) return;
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('admin_user_info')
          .select('school_id')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching school ID:', error);
          toast.error("Failed to fetch school information");
          return;
        }
        
        if (data?.school_id) {
          setSchoolId(data.school_id);
          useAuthStore.getState().setSchoolId(data.school_id);
        }
      } catch (error) {
        console.error('Error fetching school ID:', error);
        toast.error("Failed to fetch school information");
      }
    };
    
    fetchSchoolId();
  }, [user?.id, storeSchoolId]);

  useEffect(() => {
    const fetchSchoolInfo = async () => {
      if (!schoolId) return;
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('school_info')
          .select('id, name, address, location')
          .eq('id', schoolId)
          .single();
        
        if (error) throw error;
        
        setSchoolInfo(data);
        
        if (data?.address && scheduleForm.meetingType === 'offline' && !scheduleForm.location) {
          setScheduleForm(prev => ({
            ...prev,
            location: data.address
          }));
        }
      } catch (error) {
        console.error('Error fetching school info:', error);
        toast.error("Failed to fetch school information");
      }
    };
    
    fetchSchoolInfo();
  }, [schoolId]);

  useEffect(() => {
    const fetchSavedPanelists = async () => {
      if (!schoolId || !open) return;
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('admin_user_info')
          .select('id, first_name, last_name, email, role, avatar')
          .eq('school_id', schoolId);
        
        if (error) throw error;
        
        const validatedPanelists = (data || []).map(panelist => ({
          id: panelist.id || '',
          first_name: panelist.first_name || '',
          last_name: panelist.last_name || '',
          email: panelist.email || '',
          role: panelist.role || '',
          avatar: panelist.avatar || null
        }));
        
        setSavedPanelists(validatedPanelists);
        console.log('Saved panelists updated:', validatedPanelists.length);
      } catch (error) {
        console.error('Error fetching saved panelists:', error);
        toast.error("Failed to fetch panelists");
      }
    };
    
    fetchSavedPanelists();
  }, [schoolId, open]);

  useEffect(() => {
    const fetchPreferredSlots = async () => {
      if (!candidate?.application_id) return;
      
      setSelectedPreferredSlot(null);
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('application_interview_slots')
          .select('selected_slots')
          .eq('id', candidate.application_id)
          .single();
        
        if (error) {
          console.warn('No preferred slots found for candidate:', error);
          setPreferredSlots([]);
          return;
        }
        
        if (data?.selected_slots && Array.isArray(data.selected_slots)) {
          let uniqueSlots = data.selected_slots.filter((slot, index, self) =>
            index === self.findIndex(s => 
              s.day === slot.day && 
              s.start_time === slot.start_time && 
              s.duration === slot.duration
            )
          );
          
          uniqueSlots = uniqueSlots.sort((a, b) => {
            const [aHours, aMinutes] = a.start_time.split(':').map(Number);
            const [bHours, bMinutes] = b.start_time.split(':').map(Number);
            const aTotalMinutes = aHours * 60 + aMinutes;
            const bTotalMinutes = bHours * 60 + bMinutes;
            return aTotalMinutes - bTotalMinutes;
          });
          
          setPreferredSlots(uniqueSlots);
        } else {
          setPreferredSlots([]);
        }
      } catch (error) {
        console.error('Error fetching preferred slots:', error);
        setPreferredSlots([]);
      }
    };
    
    fetchPreferredSlots();
  }, [candidate?.application_id]);

  const handlePanelistAdd = useCallback((p: Panelist): void => {
    console.log('handlePanelistAdd called with:', p);
    // Check if panelist is already selected
    if (!selectedPanelists.some(selected => selected.id === p.id)) {
      console.log('Adding new panelist');
      // Update the form's panelists field with comma-separated emails
      const newEmails = [...selectedPanelists, p].map(panelist => panelist.email);
      const newValue = newEmails.join(', ') + (newEmails.length > 0 ? ', ' : '');
      
      setScheduleForm(prevForm => ({
        ...prevForm,
        panelists: newValue
      }));
      
      // Update selected panelists after schedule form is updated
      setSelectedPanelists(prev => [...prev, p]);
      console.log('State updated, selectedPanelists now:', [...selectedPanelists, p]);
    } else {
      console.log('Panelist already selected, skipping');
    }
  }, [selectedPanelists, setScheduleForm]);

  const removePanelist = useCallback((emailToRemove: string) => {
    // Update the form's panelists field with remaining emails
    const updatedSelectedPanelists = selectedPanelists.filter(panelist => panelist.email !== emailToRemove);
    const remainingEmails = updatedSelectedPanelists.map(panelist => panelist.email);
    const newValue = remainingEmails.join(', ') + (remainingEmails.length > 0 ? ', ' : '');
    
    setScheduleForm(prevForm => ({
      ...prevForm,
      panelists: newValue
    }));
    
    // Update selected panelists after schedule form is updated
    setSelectedPanelists(updatedSelectedPanelists);
  }, [selectedPanelists, setScheduleForm]);

  const handleFormChange = useCallback((field: keyof ScheduleInterviewForm, value: string) => {
    if (field === 'time' || field === 'duration') {
      setSelectedPreferredSlot(null);
    }
    
    if (field === 'date') {
      setSelectedPreferredSlot(null);
    }
    
    setScheduleForm(prev => ({
        ...prev,
        [field]: value
    }));
  }, [setSelectedPreferredSlot, setScheduleForm]);

  useEffect(() => {
    if (preferredSlots.length > 0 && scheduleForm.date) {
      const matchingSlot = preferredSlots.find(slot => {
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const slotDayIndex = daysOfWeek.indexOf(slot.day.toLowerCase());
        
        if (slotDayIndex !== -1) {
          const inputDate = new Date(scheduleForm.date);
          const inputDayIndex = inputDate.getDay();
          
          return inputDayIndex === slotDayIndex && 
                 slot.start_time === scheduleForm.time && 
                 slot.duration === scheduleForm.duration;
        }
        return false;
      });
      
      if (matchingSlot && 
          (selectedPreferredSlot?.id !== matchingSlot.id || 
           selectedPreferredSlot?.start_time !== matchingSlot.start_time ||
           selectedPreferredSlot?.duration !== matchingSlot.duration)) {
        setSelectedPreferredSlot(matchingSlot);
      }
    }
  }, [scheduleForm.date, scheduleForm.time, scheduleForm.duration, preferredSlots, selectedPreferredSlot]);

  const handleMeetingTypeChange = useCallback((value: "offline" | "online") => {
    setScheduleForm(prev => {
      const updatedForm: ScheduleInterviewForm = {
        ...prev,
        meetingType: value,
        location: value === "online" ? "Google Meet link will be generated automatically" : (schoolInfo?.address || ""),
        meetingPlatform: value === "online" ? "google" : ""
      };
      return updatedForm;
    });
  }, [schoolInfo]);

  const handlePreferredSlotSelect = useCallback((slot: PreferredSlot) => {
    setSelectedPreferredSlot(slot);
    
    setScheduleForm(prev => ({
      ...prev,
      time: slot.start_time,
      duration: slot.duration
    }));
    
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date();
    const todayIndex = today.getDay();
    const slotDayIndex = daysOfWeek.indexOf(slot.day.toLowerCase());
    
    if (slotDayIndex !== -1) {
      let daysUntilSlot = slotDayIndex - todayIndex;
      if (daysUntilSlot <= 0) {
        daysUntilSlot += 7;
      }
      
      const nextSlotDate = new Date(today);
      nextSlotDate.setDate(today.getDate() + daysUntilSlot);
      
      const formattedDate = nextSlotDate.toISOString().split('T')[0];
      
      setScheduleForm(prev => ({
        ...prev,
        date: formattedDate,
        time: slot.start_time,
        duration: slot.duration
      }));
    }
    
    toast.info(`Selected preferred slot: ${slot.day} at ${slot.start_time} for ${slot.duration} minutes`);
  }, [setSelectedPreferredSlot, setScheduleForm]);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSaveSchedule = useCallback(async () => {
    // Get school ID from auth store
    const currentSchoolId = useAuthStore.getState().schoolId;
    if (!candidate || !currentSchoolId) {
      toast.error("Missing required information. Please try again.");
      return;
    }
    
    const date = scheduleForm.date?.trim();
    const time = scheduleForm.time?.trim();
    const duration = scheduleForm.duration?.trim();
    
    if (!date) {
      toast.error("Please select a date for the interview");
      return;
    }
    
    if (!time) {
      toast.error("Please select a time for the interview");
      return;
    }
    
    if (!duration) {
      toast.error("Please enter the duration for the interview");
      return;
    }
    
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      toast.error("Please enter a valid duration (positive number)");
      return;
    }
    
    const dateTimeString = `${date}T${time}`;
    const startDate = new Date(dateTimeString);
    if (isNaN(startDate.getTime())) {
      toast.error("Please enter a valid date and time");
      return;
    }
    
    const now = new Date();
    if (startDate < now) {
      toast.error("Cannot schedule an interview in the past. Please select a future date and time.");
      return;
    }
    
    const currentPanelistEmails = selectedPanelists.map(panelist => panelist.email);
    
    for (const email of currentPanelistEmails) {
      if (!isValidEmail(email)) {
        toast.error(`Invalid email format: ${email}`);
        return;
      }
    }
    
    // Validate required IDs are valid UUIDs
    if (!candidate.job_id || candidate.job_id === '') {
      toast.error("Job ID is missing. Cannot schedule interview.");
      return;
    }
    
    if (!candidate.application_id || candidate.application_id === '') {
      toast.error("Application ID is missing. Cannot schedule interview.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const supabase = createClient();
      const { data: insertData, error: insertError } = await supabase
        .from('interview_schedule')
        .insert({
          school_id: currentSchoolId,
          candidate_email: candidate.email,
          job_id: candidate.job_id,
          panelists: currentPanelistEmails.map((email: string) => ({ email })),
          interview_date: date,
          interview_time: time,
          duration_minutes: durationNum,
          type: scheduleForm.meetingType,
          meet_link: null,
          candidate_id: candidate.application_id,
          status: scheduleForm.meetingType === 'online' ? 'pending' : 'scheduled'
        });
      
      if (insertError) {
        console.error('Error saving to interview_schedule:', insertError);
        
        // More specific error message for UUID validation
        if (insertError.message.includes('invalid input syntax for type uuid')) {
          toast.error(`Error saving interview: Invalid ID format detected. Please refresh the page and try again. ${insertError.message}`);
        } else {
          toast.error(`Error saving interview schedule: ${insertError.message}`);
        }
        return;
      }
      
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ status: 'interview_scheduled' })
        .eq('id', candidate.application_id);
      
      if (updateError) {
        console.error('Error updating job application status:', updateError);
        toast.error(`Error updating job application status: ${updateError.message}`);
      }
      
      toast.success("Interview scheduled successfully!");
      
      setSelectedPreferredSlot(null);
      onClose();
    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast.error(`Error scheduling interview: ${error}`);
    } finally {
      setIsSaving(false);
    }
  }, [candidate, scheduleForm, selectedPanelists, setSelectedPreferredSlot, onClose]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  // Removed handleCopyLink function as it's no longer needed
  // since we're showing a system-generated message instead of a link

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateEndTime = (startTime: string, duration: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + parseInt(duration);
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    return formatTime(endTime);
  };

        // AFTER - Line ~570
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent 
           className="max-h-[90vh] overflow-hidden p-0 w-full max-w-[98vw] sm:max-w-[80vw]"
           onInteractOutside={(e) => {
             // Prevent closing when clicking autocomplete dropdown
             const target = e.target as HTMLElement
             if (target.closest('[data-autocomplete-dropdown]')) {
               e.preventDefault()
             }
           }}
         >
        <div className="grid md:grid-cols-2 gap-0 h-full">
          {/* Left Panel - Form */}
                   <div className="p-6 overflow-y-auto max-h-[90vh]">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-semibold">Schedule Interview</DialogTitle>
              <DialogDescription className="text-slate-600">
                Schedule an interview with {candidate?.first_name} {candidate?.last_name} for {candidate?.job_title}
              </DialogDescription>
            </DialogHeader>
            
           
            
            <div className="space-y-5">
              {/* Date and Time - Unified */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">Date & Time</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 sm:col-span-1">
                    <Input
                      type="date"
                      value={scheduleForm.date}
                      onChange={(e) => handleFormChange('date', e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div>
                    <Input
                      type="time"
                      value={scheduleForm.time}
                      onChange={(e) => handleFormChange('time', e.target.value)}
                      className="h-10 text-sm"
                      placeholder="Start"
                    />
                  </div>
                  <div>
                    <Input
                      type="time"
                      value={scheduleForm.duration ? (() => {
                        const [hours, minutes] = scheduleForm.time.split(':').map(Number);
                        const totalMinutes = hours * 60 + minutes + parseInt(scheduleForm.duration);
                        const endHours = Math.floor(totalMinutes / 60);
                        const endMinutes = totalMinutes % 60;
                        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
                      })() : ''}
                      onChange={(e) => {
                        const [startHours, startMinutes] = scheduleForm.time.split(':').map(Number);
                        const [endHours, endMinutes] = e.target.value.split(':').map(Number);
                        const startTotalMinutes = startHours * 60 + startMinutes;
                        const endTotalMinutes = endHours * 60 + endMinutes;
                        const duration = endTotalMinutes - startTotalMinutes;
                        if (duration > 0) {
                          handleFormChange('duration', duration.toString());
                        }
                      }}
                      className="h-10 text-sm"
                      placeholder="End"
                    />
                  </div>
                </div>
              </div>

              {/* Preferred Slots - Inline */}
              {preferredSlots.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-900 mb-2">Candidate's preferred times:</p>
                  <div className="flex flex-wrap gap-2">
                    {preferredSlots.slice(0, 3).map((slot, index) => (
                      <button
                        key={`${slot.id}-${index}`}
                        onClick={() => handlePreferredSlotSelect(slot)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          selectedPreferredSlot?.id === slot.id && 
                          selectedPreferredSlot?.start_time === slot.start_time &&
                          selectedPreferredSlot?.duration === slot.duration
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-blue-700 hover:bg-blue-100 border border-blue-300'
                        }`}
                      >
                        {slot.day} {formatTime(slot.start_time)}
                      </button>
                    ))}
                    {preferredSlots.length > 3 && (
                      <span className="text-xs text-blue-700 self-center">+{preferredSlots.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Interview Format */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">Interview Format</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleMeetingTypeChange("online")}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      scheduleForm.meetingType === "online"
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Video className={`w-4 h-4 ${scheduleForm.meetingType === "online" ? 'text-purple-600' : 'text-slate-500'}`} />
                      <span className={`text-sm font-medium ${scheduleForm.meetingType === "online" ? 'text-purple-900' : 'text-slate-700'}`}>
                        Google Meet
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Video call link auto-generated</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleMeetingTypeChange("offline")}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      scheduleForm.meetingType === "offline"
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Building className={`w-4 h-4 ${scheduleForm.meetingType === "offline" ? 'text-purple-600' : 'text-slate-500'}`} />
                      <span className={`text-sm font-medium ${scheduleForm.meetingType === "offline" ? 'text-purple-900' : 'text-slate-700'}`}>
                        On-site
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">In-person at location</p>
                  </button>
                </div>
              </div>

              {/* Meeting Details */}
              {scheduleForm.meetingType === "online" ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <LinkIcon className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 mb-1">Meeting link will be generated</p>
                      <p className="text-xs text-slate-500">Google Meet link sent to all participants via email</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      className="pl-10 h-10 text-sm"
                      value={scheduleForm.location}
                      onChange={(e) => handleFormChange('location', e.target.value)}
                      placeholder="Enter interview location"
                    />
                  </div>
                </div>
              )}

              {/* Interviewers */}
              <div className="space-y-2" key={`interviewers-section-${selectedPanelists.length}`}>
                <Label className="text-sm font-medium text-slate-700">Interviewers</Label>
                <div className="relative">
                  <PanelistAutocomplete 
                    key={`panelist-autocomplete-${selectedPanelists.length}`}
                    panelists={savedPanelists} 
                    selected={selectedPanelists} 
                    onAdd={handlePanelistAdd} 
                  />
                </div>
                
                {/* Selected Interviewers */}
                {selectedPanelists.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedPanelists.map((panelist, index) => (
                      <PanelistDisplay
                        key={panelist.id}
                        panelist={panelist}
                        scheduleForm={scheduleForm}
                        onRemove={removePanelist}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Notes
                  <span className="text-xs text-slate-500 font-normal ml-2">(Visible to all participants)</span>
                </Label>
                <Textarea
                  value={scheduleForm.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Add any important details about this interview..."
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-5 border-t">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={isSaving}
                className="px-5 h-10"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSchedule} 
                disabled={isSaving || !schoolId}
                className="px-5 h-10 bg-purple-600 hover:bg-purple-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  "Schedule Interview"
                )}
              </Button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="bg-slate-50 p-6 overflow-y-auto max-h-[90vh] hidden md:block">
            <div className="space-y-4">
              {/* Interview Summary Card */}
              <div className="bg-white rounded-lg  border overflow-hidden">
                {/* Date and Time Header */}
                {scheduleForm.date && scheduleForm.time && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 border-b">
                    <div className="flex items-center gap-4">
                      <div className="bg-white rounded-lg p-3 text-center min-w-[60px] shadow-sm">
                        <div className="text-xs text-slate-600 uppercase font-medium">
                          {new Date(scheduleForm.date).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                          {new Date(scheduleForm.date).getDate()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-bold text-slate-900">
                          {formatTime(scheduleForm.time)} - {calculateEndTime(scheduleForm.time, scheduleForm.duration)}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                         <GlobeLock className="w-4 h-4 text-slate-500" />
                          <span>GMT+5:30 (IST) </span>
                           <Clock className="w-4 h-4 text-slate-500" />
                          <span>{scheduleForm.duration} min</span> 
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Interview Details */}
                <div className="p-4 space-y-4">
                  {/* Candidate */}
                  {candidate && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Candidate & Job
                      </h4>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {getInitials(candidate.first_name, candidate.last_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate text-sm">
                            {candidate.first_name} {candidate.last_name}
                          </p>
                          <p className="text-xs text-slate-600 truncate">{candidate.job_title}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  {candidate && <div className="border-t border-slate-200"></div>}

                  {/* Interviewers */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Interviewers
                    </h4>
                    <div className="space-y-2">
                      {selectedPanelists.length > 0 ? (
                        selectedPanelists.map((panelist, index) => (
                          <PanelistPreviewDisplay
                            key={index}
                            panelist={panelist}
                            scheduleForm={scheduleForm}
                          />
                        ))
                      ) : (
                        <p className="text-sm text-slate-400 italic p-2">No interviewers selected</p>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-200"></div>

                  {/* Location/Link */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      {scheduleForm.meetingType === "online" ? "Meeting Link" : "Location"}
                    </h4>
                    {scheduleForm.meetingType === "online" ? (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <LinkIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm text-blue-700 font-medium">
                          Google Meet link will be generated by system
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <p className="text-sm text-slate-700">
                          {scheduleForm.location || "No location set"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Note */}
                  {scheduleForm.notes && (
                    <>
                      <div className="border-t border-slate-200"></div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Notes
                        </h4>
                        <p className="text-sm text-slate-700 p-3 bg-amber-50 rounded-lg border border-amber-100">
                          {scheduleForm.notes}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Preferred Slots - Separate Card */}
              {preferredSlots.length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    Candidate's Preferred Slots
                  </h3>
                  <div className="space-y-2">
                    {preferredSlots.map((slot, index) => (
                      <button
                        key={`${slot.id}-${index}`}
                        onClick={() => handlePreferredSlotSelect(slot)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          selectedPreferredSlot?.id === slot.id && 
                          selectedPreferredSlot?.start_time === slot.start_time &&
                          selectedPreferredSlot?.duration === slot.duration
                            ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-100' 
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium capitalize text-slate-800">{slot.day}</p>
                            <p className="text-sm text-slate-600">{formatTime(slot.start_time)} • {slot.duration} min</p>
                          </div>
                          {selectedPreferredSlot?.id === slot.id && 
                           selectedPreferredSlot?.start_time === slot.start_time &&
                           selectedPreferredSlot?.duration === slot.duration && (
                            <Check className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}