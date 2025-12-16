"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  Loader2
} from "lucide-react";
import { createClient } from '@/lib/supabase/api/client';
import { useAuthStore } from '@/store/auth-store';
import { useAuth } from '@/context/auth-context';
import { toast } from "sonner";

interface Candidate {
    application_id: string;
    first_name: string;
    last_name: string;
    email: string;
    job_title: string;
    created_at: string;
    job_id: string;
}

interface SavedPanelist {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  avatar?: string | null;
}

// Add this interface for preferred interview slots
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
  const { user } = useAuth(); // Get user from auth context
  const { schoolId: storeSchoolId } = useAuthStore(); // Get schoolId from store
  const [schoolId, setSchoolId] = useState<string | null>(storeSchoolId); // Local state for schoolId
  console.log('School ID:', schoolId);
  
  // Helper function to get the next 30-minute interval
  const getNext30MinInterval = () => {
    const now = new Date();
    // Round up to the next 30-minute interval
    const minutes = now.getMinutes();
    
    // If current time is past 30 minutes, round up to next hour
    if (minutes > 30) {
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
    } else {
      // Otherwise round up to 30 minutes
      now.setMinutes(30);
    }
    
    now.setSeconds(0);
    now.setMilliseconds(0);
    
    // Format date as YYYY-MM-DD
    const date = now.toISOString().split('T')[0];
    
    // Format time as HH:MM
    const hours = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${mins}`;
    
    return { date, time };
  };

  const [scheduleForm, setScheduleForm] = useState<ScheduleInterviewForm>({
    date: '',
    time: '09:00',
    duration: '30',
    meetingType: 'offline',
    meetingPlatform: '',
    location: '',
    panelists: '',
    notes: ''
  });
  
  // Add state for preferred slots
  const [preferredSlots, setPreferredSlots] = useState<PreferredSlot[]>([]);
  const [selectedPreferredSlot, setSelectedPreferredSlot] = useState<PreferredSlot | null>(null);
  
  const [savedPanelists, setSavedPanelists] = useState<SavedPanelist[]>([]);
  
  const [filteredPanelists, setFilteredPanelists] = useState<SavedPanelist[]>([]);
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSelectingPanelist, setIsSelectingPanelist] = useState(false);
  
  // Add effect to log when showSuggestions changes
  useEffect(() => {
    console.log('Show suggestions changed to:', showSuggestions);
    setIsSelectingPanelist(showSuggestions);
  }, [showSuggestions]);
  
  // Reset isSelectingPanelist when dialog closes
  useEffect(() => {
    if (!open) {
      setIsSelectingPanelist(false);
    }
  }, [open]);
  
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const panelistInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for dropdown portal
  const [panelistDropdownPosition, setPanelistDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Fetch schoolId if not available in store
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
          // Update the store as well
          useAuthStore.getState().setSchoolId(data.school_id);
        }
      } catch (error) {
        console.error('Error fetching school ID:', error);
        toast.error("Failed to fetch school information");
      }
    };
    
    fetchSchoolId();
  }, [user?.id, storeSchoolId]);

  // Fetch school information
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
        
        // Set default location for offline meetings
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

  // Fetch saved panelists
  useEffect(() => {
    const fetchSavedPanelists = async () => {
      if (!schoolId || !open) return;
      
      try {
        const supabase = createClient();
        // Fetch panelists from admin_user_info with additional details
        const { data, error } = await supabase
          .from('admin_user_info')
          .select('id, first_name, last_name, email, role, avatar')
          .eq('school_id', schoolId);
        
        if (error) throw error;
        
        // Ensure all panelists have the required fields
        const validatedPanelists = (data || []).map(panelist => ({
          id: panelist.id || '',
          first_name: panelist.first_name || '',
          last_name: panelist.last_name || '',
          email: panelist.email || '',
          role: panelist.role || '',
          avatar: panelist.avatar || null
        }));
        
        console.log('Fetched panelists:', validatedPanelists);
        setSavedPanelists(validatedPanelists);
        
        // Update filtered panelists to exclude already selected panelists
        const selectedEmails = parsePanelistEmails(true);
        const availablePanelists = validatedPanelists.filter(
          p => !selectedEmails.includes(p.email || '')
        );
        setFilteredPanelists(availablePanelists);
      } catch (error) {
        console.error('Error fetching saved panelists:', error);
        toast.error("Failed to fetch panelists");
      }
    };
    
    fetchSavedPanelists();
  }, [schoolId, open, scheduleForm.panelists]);

  // Fetch preferred interview slots for the candidate
  useEffect(() => {
    const fetchPreferredSlots = async () => {
      if (!candidate?.application_id) return;
      
      // Reset selected preferred slot when candidate changes
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
          // Remove duplicates based on day, start_time, and duration
          let uniqueSlots = data.selected_slots.filter((slot, index, self) =>
            index === self.findIndex(s => 
              s.day === slot.day && 
              s.start_time === slot.start_time && 
              s.duration === slot.duration
            )
          );
          
          // Sort slots by start time
          uniqueSlots = uniqueSlots.sort((a, b) => {
            // Convert time strings to comparable values
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

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Add a small delay to allow the dropdown item click to be processed first
      setTimeout(() => {
        console.log('Click outside event triggered:', event.target);
        // Don't close if clicking on the dropdown or its children
        if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
          console.log('Clicked on dropdown, not closing');
          return;
        }
        
        // Don't close if clicking on the input field
        if (panelistInputRef.current && panelistInputRef.current.contains(event.target as Node)) {
          console.log('Clicked on input, not closing');
          return;
        }
        
        // Don't close if clicking on the suggestions container
        if (suggestionsRef.current && suggestionsRef.current.contains(event.target as Node)) {
          console.log('Clicked on suggestions container, not closing');
          return;
        }
        
        // Close suggestions for clicks outside
        console.log('Closing suggestions');
        setShowSuggestions(false);
        setIsSelectingPanelist(false);
      }, 10);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Handle scroll events to update dropdown position
  useEffect(() => {
    const handleScroll = () => {
      if (showSuggestions && panelistInputRef.current) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (showSuggestions && panelistInputRef.current) {
        updateDropdownPosition();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [showSuggestions]);

  // Filter panelists based on input
  const handlePanelistInputChange = (value: string) => {
    console.log('Panelist input changed:', value);
    
    if (value.trim() === '') {
      // Update the form state
      setScheduleForm(prev => ({
        ...prev,
        panelists: value
      }));
      
      setFilteredPanelists([]);
      setShowSuggestions(false);
      return;
    }
    
    const parts = value.split(',');
    const lastEmail = parts[parts.length - 1]?.trim() || '';
    
    // Validate all emails except the last one (which might still be typing)
    const validParts = [];
    let hasInvalidEmail = false;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const email = parts[i].trim();
      if (email && !isValidEmail(email)) {
        toast.error(`Invalid email format: ${email}`);
        hasInvalidEmail = true;
        // Keep the invalid email in the input but don't add it to valid parts
        validParts.push(parts[i]);
      } else if (email) {
        validParts.push(email);
      }
    }
    
    // If we found invalid emails, reconstruct the input value without adding them to the list
    if (hasInvalidEmail) {
      const reconstructedValue = [...validParts, parts[parts.length - 1]].join(', ');
      setScheduleForm(prev => ({
        ...prev,
        panelists: reconstructedValue
      }));
      
      // Don't proceed with showing suggestions for invalid input
      return;
    }
    
    // If all emails are valid, update the form normally
    setScheduleForm(prev => ({
      ...prev,
      panelists: value
    }));
    
    if (lastEmail.length > 0) {
      // Filter out already selected panelists
      const selectedEmails = parsePanelistEmails(true);
      const availablePanelists = savedPanelists.filter(
        panelist => !selectedEmails.includes(panelist.email || '')
      );
      
      const filtered = availablePanelists.filter(panelist => 
        (panelist.email || '').toLowerCase().includes(lastEmail.toLowerCase()) ||
        (panelist.first_name || '').toLowerCase().includes(lastEmail.toLowerCase()) ||
        (panelist.last_name || '').toLowerCase().includes(lastEmail.toLowerCase()) ||
        `${panelist.first_name || ''} ${panelist.last_name || ''}`.toLowerCase().includes(lastEmail.toLowerCase())
      );
      console.log('Filtered panelists:', filtered);
      setFilteredPanelists(filtered);
      setShowSuggestions(filtered.length > 0);
      console.log('Show suggestions:', filtered.length > 0);
    } else {
      // When there's no text after the last comma, show all available panelists
      const selectedEmails = parsePanelistEmails(true);
      const availablePanelists = savedPanelists.filter(
        panelist => !selectedEmails.includes(panelist.email || '')
      );
      setFilteredPanelists(availablePanelists);
      setShowSuggestions(availablePanelists.length > 0);
      console.log('Show all panelists:', availablePanelists.length > 0);
    }
  };

  // Update dropdown position when input ref changes
  const updateDropdownPosition = () => {
    if (panelistInputRef.current) {
      const rect = panelistInputRef.current.getBoundingClientRect();
      console.log('Updating dropdown position:', rect);
      setPanelistDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // Select a panelist from suggestions
  const selectPanelist = (panelist: SavedPanelist, e: React.MouseEvent) => {
    console.log('Selecting panelist:', panelist);
    e.stopPropagation(); // Prevent event from bubbling up
    e.preventDefault(); // Prevent default behavior
    
    const panelistEmail = panelist.email || '';
    if (!panelistEmail) return;
    
    // Validate email format
    if (!isValidEmail(panelistEmail)) {
      toast.error(`Invalid email format: ${panelistEmail}`);
      return;
    }
    
    // Get current panelist emails
    const currentEmails = parsePanelistEmails();
    console.log('Current emails:', currentEmails);
    
    // Check if panelist is already selected
    if (currentEmails.includes(panelistEmail)) {
      console.log('Panelist already selected');
      // If already selected, just close the suggestions
      setShowSuggestions(false);
      setIsSelectingPanelist(false);
      setTimeout(() => {
        panelistInputRef.current?.focus();
      }, 0);
      return;
    }
    
    // Add the new panelist email to the list
    const newEmails = [...currentEmails, panelistEmail];
    const newValue = newEmails.join(', ') + (newEmails.length > 0 ? ', ' : '');
    console.log('New value:', newValue);
    
    // Update the form state
    setScheduleForm(prev => ({
      ...prev,
      panelists: newValue
    }));
    
    // Close suggestions
    setShowSuggestions(false);
    setIsSelectingPanelist(false);
    
    // Update filtered panelists to exclude the newly selected panelist
    const availablePanelists = savedPanelists.filter(
      p => !newEmails.includes(p.email || '')
    );
    setFilteredPanelists(availablePanelists);
    
    // Focus back on the input
    setTimeout(() => {
      panelistInputRef.current?.focus();
    }, 0);
  };

  // Function to handle form changes
  const handleFormChange = (field: keyof ScheduleInterviewForm, value: string) => {
    // If user manually changes time or duration, deselect preferred slot
    if (field === 'time' || field === 'duration') {
      setSelectedPreferredSlot(null);
    }
    
    // If user manually changes date, deselect preferred slot
    if (field === 'date') {
      setSelectedPreferredSlot(null);
    }
    
    setScheduleForm(prev => ({
        ...prev,
        [field]: value
    }));
  };

  // Check if manually entered time matches any preferred slot
  useEffect(() => {
    // Only check if we have preferred slots and a complete date
    if (preferredSlots.length > 0 && scheduleForm.date) {
      const matchingSlot = preferredSlots.find(slot => {
        // Convert day name to date
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const slotDayIndex = daysOfWeek.indexOf(slot.day.toLowerCase());
        
        if (slotDayIndex !== -1) {
          const inputDate = new Date(scheduleForm.date);
          const inputDayIndex = inputDate.getDay();
          
          // Check if the date matches the slot's day and time/duration match
          return inputDayIndex === slotDayIndex && 
                 slot.start_time === scheduleForm.time && 
                 slot.duration === scheduleForm.duration;
        }
        return false;
      });
      
      // Only set if not already selected (to avoid infinite loops)
      if (matchingSlot && 
          (selectedPreferredSlot?.id !== matchingSlot.id || 
           selectedPreferredSlot?.start_time !== matchingSlot.start_time ||
           selectedPreferredSlot?.duration !== matchingSlot.duration)) {
        setSelectedPreferredSlot(matchingSlot);
      }
    }
  }, [scheduleForm.date, scheduleForm.time, scheduleForm.duration, preferredSlots, selectedPreferredSlot]);

  // Function to handle meeting type change
  const handleMeetingTypeChange = (value: "offline" | "online") => {
    setScheduleForm(prev => {
      const updatedForm: ScheduleInterviewForm = {
        ...prev,
        meetingType: value,
        // Clear location when switching to online, set school address for offline
        location: value === "online" ? "Google Meet link will be generated automatically" : (schoolInfo?.address || ""),
        meetingPlatform: value === "online" ? "google" : ""  // Always set to google for online
      };
      return updatedForm;
    });
  };

  // Function to handle selection of a preferred slot
  const handlePreferredSlotSelect = (slot: PreferredSlot) => {
    setSelectedPreferredSlot(slot);
    
    // Update form with slot information
    setScheduleForm(prev => ({
      ...prev,
      time: slot.start_time,
      duration: slot.duration
    }));
    
    // Find the next occurrence of the specified day
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date();
    const todayIndex = today.getDay();
    const slotDayIndex = daysOfWeek.indexOf(slot.day.toLowerCase());
    
    if (slotDayIndex !== -1) {
      let daysUntilSlot = slotDayIndex - todayIndex;
      if (daysUntilSlot <= 0) {
        daysUntilSlot += 7; // If the day has passed this week, use next week
      }
      
      const nextSlotDate = new Date(today);
      nextSlotDate.setDate(today.getDate() + daysUntilSlot);
      
      // Format as YYYY-MM-DD for the date input
      const formattedDate = nextSlotDate.toISOString().split('T')[0];
      
      // Update the date in the form
      setScheduleForm(prev => ({
        ...prev,
        date: formattedDate,
        time: slot.start_time,
        duration: slot.duration
      }));
    }
    
    // Show a toast notification
    toast.info(`Selected preferred slot: ${slot.day} at ${slot.start_time} for ${slot.duration} minutes`);
  };

    // Function to validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Function to parse panelist emails
  const parsePanelistEmails = (includeInvalid: boolean = false): string[] => {
    const emails = scheduleForm.panelists
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    if (includeInvalid) {
      return emails;
    }
    
    // Filter out invalid emails
    return emails.filter(email => isValidEmail(email));
  };

  // Function to remove a panelist
  const removePanelist = (emailToRemove: string) => {
    const currentEmails = parsePanelistEmails(true); // Get all emails including invalid ones
    const updatedEmails = currentEmails.filter(email => email !== emailToRemove);
    const newValue = updatedEmails.join(', ') + (updatedEmails.length > 0 ? ', ' : '');
    
    // Update the form state
    setScheduleForm(prev => ({
      ...prev,
      panelists: newValue
    }));
    
    // Update filtered panelists to include the newly available panelist
    const availablePanelists = savedPanelists.filter(
      p => !updatedEmails.includes(p.email || '')
    );
    setFilteredPanelists(availablePanelists);
  };

  // Function to add a panelist
  const addPanelist = (emailToAdd: string) => {
    if (!emailToAdd) return;
    
    // Validate email format
    if (!isValidEmail(emailToAdd)) {
      toast.error(`Invalid email format: ${emailToAdd}`);
      return;
    }
    
    const currentEmails = parsePanelistEmails();
    // Check if panelist is already selected
    if (currentEmails.includes(emailToAdd)) {
      return;
    }
    
    // Add the new panelist email to the list
    const newEmails = [...currentEmails, emailToAdd];
    const newValue = newEmails.join(', ') + (newEmails.length > 0 ? ', ' : '');
    
    // Update the form state
    setScheduleForm(prev => ({
      ...prev,
      panelists: newValue
    }));
    
    // Update filtered panelists to exclude the newly added panelist
    const availablePanelists = savedPanelists.filter(
      p => !newEmails.includes(p.email || '')
    );
    setFilteredPanelists(availablePanelists);
  };

  // Function to handle saving the interview schedule
  const handleSaveSchedule = async () => {
    if (!candidate || !schoolId) {
      toast.error("Missing required information. Please try again.");
      return;
    }
    
    // Validate required fields with trimmed values
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
    
    // Validate that duration is a valid number
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      toast.error("Please enter a valid duration (positive number)");
      return;
    }
    
    // Validate date and time format
    const dateTimeString = `${date}T${time}`;
    const startDate = new Date(dateTimeString);
    if (isNaN(startDate.getTime())) {
      toast.error("Please enter a valid date and time");
      return;
    }
    
    // Check if the selected date and time is in the past
    const now = new Date();
    if (startDate < now) {
      toast.error("Cannot schedule an interview in the past. Please select a future date and time.");
      return;
    }
    
    // Parse current panelist emails
    const currentPanelistEmails = parsePanelistEmails();
    
    // Validate all panelist emails
    for (const email of currentPanelistEmails) {
      if (!isValidEmail(email)) {
        toast.error(`Invalid email format: ${email}`);
        return;
      }
    }
    
    // Set loading state
    setIsSaving(true);
    
    try {
      // Save to interview_schedule table
      const supabase = createClient();
      const { data: insertData, error: insertError } = await supabase
        .from('interview_schedule')
        .insert({
          school_id: schoolId,
          candidate_email: candidate.email,
          job_id: candidate.job_id || '',
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
        toast.error(`Error saving interview schedule: ${insertError.message}`);
        return;
      }
      
      // Update job_application status to interview_scheduled
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ status: 'interview_scheduled' })
        .eq('id', candidate.application_id);
      
      if (updateError) {
        console.error('Error updating job application status:', updateError);
        toast.error(`Error updating job application status: ${updateError.message}`);
        // Note: The interview schedule was saved successfully, but the status update failed
      } else {
        console.log('Job application status updated to interview_scheduled');
      }
      
      toast.success("Interview scheduled successfully!");
      console.log('Interview scheduled successfully:', insertData);
      
      // Reset selected preferred slot
      setSelectedPreferredSlot(null);
      
      // Close the dialog after saving
      onClose();
    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast.error(`Error scheduling interview: ${error}`);
    } finally {
      // Reset loading state
      setIsSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get candidate initials for avatar
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      // Don't close the sheet when selecting a panelist
      if (!isOpen && isSelectingPanelist) {
        console.log('Preventing sheet close while selecting panelist');
        return;
      }
      onOpenChange(isOpen);
    }}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl flex flex-col h-screen"
      >
        <SheetHeader>
          <SheetTitle>Schedule Interview</SheetTitle>
          <SheetDescription>
            Schedule an interview for {candidate?.first_name} {candidate?.last_name}
          </SheetDescription>
        </SheetHeader>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-4">
          {/* Candidate Details Section */}
          {candidate && (
            <div className="rounded-lg pb-4 mb-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {getInitials(candidate.first_name, candidate.last_name)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {candidate.first_name} {candidate.last_name} <span className="text-slate-600 font-normal">({candidate.email})</span>
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-slate-600 flex items-center gap-1">
                      <Briefcase className="w-4 h-4 flex-shrink-0" />
                      <span className="text-slate-800">{candidate.job_title}</span>
                    </p>
                    <p className="text-slate-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="text-slate-800">Applied on {formatDate(candidate.created_at)}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Preferred Slots Section */}
              {preferredSlots.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-slate-800 mb-2">Preferred Slots</h4>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {preferredSlots.map((slot, index) => (
                      <div 
                        key={`${slot.id}-${index}`}
                        className={`min-w-[120px] p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedPreferredSlot?.id === slot.id && 
                          selectedPreferredSlot?.start_time === slot.start_time &&
                          selectedPreferredSlot?.duration === slot.duration
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                        onClick={() => handlePreferredSlotSelect(slot)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium capitalize text-slate-800">{slot.day}</span>
                          <span className="text-sm text-slate-600">{slot.start_time} ({slot.duration} min)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
          
          <div className="grid gap-4">
            {/* Date, Time, and Duration in one row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => handleFormChange('date', e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => handleFormChange('time', e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={scheduleForm.duration}
                  onChange={(e) => handleFormChange('duration', e.target.value)}
                  placeholder="Enter duration in minutes"
                />
              </div>
            </div>
            
            {/* Meeting Type Selection */}
            <div className="grid gap-2">
              <Label htmlFor="meetingType">Meeting Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={scheduleForm.meetingType === "offline" ? "default" : "outline"}
                  className="flex items-center gap-2"
                  onClick={() => handleMeetingTypeChange("offline")}
                >
                  <Building className="w-4 h-4" />
                  Offline
                </Button>
                <Button
                  type="button"
                  variant={scheduleForm.meetingType === "online" ? "default" : "outline"}
                  className="flex items-center gap-2"
                  onClick={() => handleMeetingTypeChange("online")}
                >
                  <Monitor className="w-4 h-4" />
                  Online
                </Button>
              </div>
            </div>
            
            {/* Location/Meeting Link Input */}
            {scheduleForm.meetingType === "offline" && (
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="location"
                    className="pl-10"
                    value={scheduleForm.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="Enter interview location"
                  />
                </div>
                {schoolInfo?.address && (
                  <p className="text-sm text-gray-500">
                    Default location from school address
                  </p>
                )}
              </div>
            )}
            
            {scheduleForm.meetingType === "online" && (
              <div className="grid gap-2">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800 font-medium">Google Meet</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Google Meet link will be generated automatically and sent to candidate and panelists
                  </p>
                </div>
              </div>
            )}
            
            {/* Panelists Input with Autocomplete */}
            <div className="grid gap-2 relative" ref={suggestionsRef}>
              <Label htmlFor="panelists">Panelists</Label>
              <div className="relative">
                <Input
                  ref={panelistInputRef}
                  id="panelists"
                  value={scheduleForm.panelists}
                  onChange={(e) => handlePanelistInputChange(e.target.value)}
                  onBlur={(e) => {
                    // Validate the last email when user leaves the input field
                    const parts = scheduleForm.panelists.split(',');
                    if (parts.length > 0) {
                      const lastEmail = parts[parts.length - 1]?.trim() || '';
                      if (lastEmail && !isValidEmail(lastEmail)) {
                        toast.error(`Invalid email format: ${lastEmail}`);
                      }
                    }
                  }}
                  placeholder="Enter panelist emails separated by commas"
                  onFocus={(e) => {
                    console.log('Panelist input focused');
                    updateDropdownPosition();
                    if (savedPanelists.length > 0) {
                      const parts = scheduleForm.panelists.split(',');
                      const lastEmail = parts[parts.length - 1]?.trim() || '';
                      
                      if (lastEmail.length > 0) {
                        // Filter out already selected panelists
                        const selectedEmails = parsePanelistEmails(true);
                        const availablePanelists = savedPanelists.filter(
                          panelist => !selectedEmails.includes(panelist.email || '')
                        );
                        
                        const filtered = availablePanelists.filter(panelist => 
                          (panelist.email || '').toLowerCase().includes(lastEmail.toLowerCase()) ||
                          (panelist.first_name || '').toLowerCase().includes(lastEmail.toLowerCase()) ||
                          (panelist.last_name || '').toLowerCase().includes(lastEmail.toLowerCase()) ||
                          `${panelist.first_name || ''} ${panelist.last_name || ''}`.toLowerCase().includes(lastEmail.toLowerCase())
                        );
                        console.log('Filtered panelists on focus:', filtered);
                        setFilteredPanelists(filtered);
                        setShowSuggestions(filtered.length > 0);
                        console.log('Show suggestions on focus:', filtered.length > 0);
                      } else {
                        // When there's no text after the last comma, show all available panelists
                        const selectedEmails = parsePanelistEmails(true);
                        const availablePanelists = savedPanelists.filter(
                          panelist => !selectedEmails.includes(panelist.email || '')
                        );
                        setFilteredPanelists(availablePanelists);
                        setShowSuggestions(true);
                        console.log('Show all panelists on focus:', true);
                      }
                    }
                  }}
                  onClick={updateDropdownPosition}
                />
                {savedPanelists.length > 0 && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => {
                      // Focus on input and show all panelists (excluding already selected ones)
                      panelistInputRef.current?.focus();
                      updateDropdownPosition();
                      const selectedEmails = parsePanelistEmails(true);
                      const availablePanelists = savedPanelists.filter(
                        panelist => !selectedEmails.includes(panelist.email || '')
                      );
                      setFilteredPanelists(availablePanelists);
                      setShowSuggestions(true);
                    }}
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <p className="text-sm text-gray-500">
                Enter multiple email addresses separated by commas
              </p>
            </div>
            
            {/* Panelists Display */}
            {(() => {
              const currentPanelistEmails = parsePanelistEmails();
              return currentPanelistEmails.length > 0 && (
                <div className="grid gap-2">
                  <Label>Panelists</Label>
                  <div className="flex flex-wrap gap-2">
                    {currentPanelistEmails.map((email, index) => {
                      // Find the panelist object to get avatar info
                      const panelist = savedPanelists.find(p => p.email === email);
                      
                      return (
                        <div 
                          key={index} 
                          className="flex items-center gap-2 border border-gray-300 text-black rounded-full px-3 py-1 text-sm"
                        >
                          {/* Display avatar if available, otherwise show initials */}
                          {panelist?.avatar ? (
                            <img 
                              src={panelist.avatar} 
                              alt={`${panelist.first_name || ''} ${panelist.last_name || ''}`}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                              {panelist ? 
                                `${(panelist.first_name || '').charAt(0)}${(panelist.last_name || '').charAt(0)}` :
                                email.charAt(0).toUpperCase()
                              }
                            </div>
                          )}
                          <span>{email}</span>
                          <button 
                            type="button"
                            onClick={() => removePanelist(email)}
                            className="text-black hover:text-gray-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={scheduleForm.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Add any additional notes for the interview"
                rows={4}
              />
            </div>
          </div>
        </div>
        
        {/* Sticky footer */}
        <div className="flex justify-end gap-2 p-4 border-t bg-white">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSaveSchedule} disabled={isSaving || !schoolId}>
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
      </SheetContent>
      
      {/* Portal for panelist suggestions dropdown to avoid clipping */}
      {showSuggestions && filteredPanelists.length > 0 && (
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
          style={{
            top: `${panelistDropdownPosition.top}px`,
            left: `${panelistDropdownPosition.left}px`,
            width: `${panelistDropdownPosition.width}px`,
            pointerEvents: 'auto' // Ensure the dropdown can receive events
          }}
          onClick={(e) => {
            // Prevent click from propagating to the Sheet component
            e.stopPropagation();
          }}
        >
          <div className="debug-dropdown-content">
            {filteredPanelists.map((panelist) => (
              <div
                key={panelist.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                onClick={(e) => {
                  console.log('Dropdown item clicked:', panelist);
                  selectPanelist(panelist, e);
                }}
              >
                {/* Display avatar if available, otherwise show initials */}
                {panelist.avatar ? (
                  <img 
                    src={panelist.avatar} 
                    alt={`${panelist.first_name || ''} ${panelist.last_name || ''}`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                    {`${(panelist.first_name || '').charAt(0)}${(panelist.last_name || '').charAt(0)}`}
                  </div>
                )}
                <div>
                  <div className="font-medium">{panelist.first_name || ''} {panelist.last_name || ''}</div>
                  <div className="text-sm text-gray-500">{panelist.email || ''}</div>
                  <div className="text-xs text-gray-400 capitalize">{panelist.role || ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}
