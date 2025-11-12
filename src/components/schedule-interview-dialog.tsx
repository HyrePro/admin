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
  name: string;
  email: string;
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
  const [savedPanelists, setSavedPanelists] = useState<SavedPanelist[]>([]);
  const [filteredPanelists, setFilteredPanelists] = useState<SavedPanelist[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const panelistInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
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
        const { data, error } = await supabase
          .from('interview_panelists')
          .select('*')
          .eq('school_id', schoolId);
        
        if (error) throw error;
        
        setSavedPanelists(data || []);
      } catch (error) {
        console.error('Error fetching saved panelists:', error);
        toast.error("Failed to fetch panelists");
      }
    };
    
    fetchSavedPanelists();
  }, [schoolId, open]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          panelistInputRef.current && !panelistInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
    handleFormChange('panelists', value);
    
    if (value.trim() === '') {
      setFilteredPanelists([]);
      setShowSuggestions(false);
      return;
    }
    
    const lastEmail = value.split(',').pop()?.trim() || '';
    if (lastEmail.length > 0) {
      // Filter out already selected panelists
      const selectedEmails = parsePanelistEmails();
      const availablePanelists = savedPanelists.filter(
        panelist => !selectedEmails.includes(panelist.email)
      );
      
      const filtered = availablePanelists.filter(panelist => 
        panelist.email.toLowerCase().includes(lastEmail.toLowerCase()) ||
        panelist.name.toLowerCase().includes(lastEmail.toLowerCase())
      );
      setFilteredPanelists(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredPanelists([]);
      setShowSuggestions(false);
    }
  };

  // Update dropdown position when input ref changes
  const updateDropdownPosition = () => {
    if (panelistInputRef.current) {
      const rect = panelistInputRef.current.getBoundingClientRect();
      setPanelistDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // Select a panelist from suggestions
  const selectPanelist = (panelist: SavedPanelist) => {
    const emails = scheduleForm.panelists.split(',').map(email => email.trim());
    // Replace the last email with the selected panelist
    emails[emails.length - 1] = panelist.email;
    handleFormChange('panelists', emails.join(', ') + ', ');
    setShowSuggestions(false);
    // Focus back on the input
    setTimeout(() => {
      panelistInputRef.current?.focus();
    }, 0);
  };

  // Function to handle form changes
  const handleFormChange = (field: keyof ScheduleInterviewForm, value: string) => {
    setScheduleForm(prev => ({
        ...prev,
        [field]: value
    }));
  };

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

  // Function to parse panelist emails
  const parsePanelistEmails = (): string[] => {
    return scheduleForm.panelists
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  };

  // Function to remove a panelist
  const removePanelist = (emailToRemove: string) => {
    const currentEmails = parsePanelistEmails();
    const updatedEmails = currentEmails.filter(email => email !== emailToRemove);
    handleFormChange('panelists', updatedEmails.join(', '));
  };

  // Function to add a panelist
  const addPanelist = (emailToAdd: string) => {
    if (!emailToAdd) return;
    
    const currentEmails = parsePanelistEmails();
    if (!currentEmails.includes(emailToAdd)) {
      handleFormChange('panelists', [...currentEmails, emailToAdd].join(', '));
    }
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
          panelists: panelistEmails.map(email => ({ email })),
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

  // Parse panelist emails for display
  const panelistEmails = parsePanelistEmails();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>Schedule Interview</SheetTitle>
          <SheetDescription>
            Schedule an interview for {candidate?.first_name} {candidate?.last_name}
          </SheetDescription>
        </SheetHeader>
        
        {/* Candidate Details Section */}
        {candidate && (
          <div className="rounded-lg px-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {getInitials(candidate.first_name, candidate.last_name)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {candidate.first_name} {candidate.last_name}
                </h3>
                <p className="text-slate-600 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {candidate.email}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-600">
                <Briefcase className="w-4 h-4 flex-shrink-0" />
                <span className="text-slate-800">{candidate.job_title}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="text-slate-800">Applied on {formatDate(candidate.created_at)}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4">
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
                  placeholder="Enter panelist emails separated by commas"
                  onFocus={(e) => {
                    updateDropdownPosition();
                    if (savedPanelists.length > 0) {
                      const lastEmail = scheduleForm.panelists.split(',').pop()?.trim() || '';
                      if (lastEmail.length > 0) {
                        // Filter out already selected panelists
                        const selectedEmails = parsePanelistEmails();
                        const availablePanelists = savedPanelists.filter(
                          panelist => !selectedEmails.includes(panelist.email)
                        );
                        
                        const filtered = availablePanelists.filter(panelist => 
                          panelist.email.toLowerCase().includes(lastEmail.toLowerCase()) ||
                          panelist.name.toLowerCase().includes(lastEmail.toLowerCase())
                        );
                        setFilteredPanelists(filtered);
                        setShowSuggestions(filtered.length > 0);
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
                      const selectedEmails = parsePanelistEmails();
                      const availablePanelists = savedPanelists.filter(
                        panelist => !selectedEmails.includes(panelist.email)
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
            {panelistEmails.length > 0 && (
              <div className="grid gap-2">
                <Label>Panelists</Label>
                <div className="flex flex-wrap gap-2">
                  {panelistEmails.map((email, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{email}</span>
                      <button 
                        type="button"
                        onClick={() => removePanelist(email)}
                        className="text-blue-800 hover:text-blue-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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
          className="fixed z-[1000] bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
          style={{
            top: `${panelistDropdownPosition.top}px`,
            left: `${panelistDropdownPosition.left}px`,
            width: `${panelistDropdownPosition.width}px`
          }}
        >
          {filteredPanelists.map((panelist) => (
            <div
              key={panelist.id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
              onClick={() => selectPanelist(panelist)}
            >
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">{panelist.name}</div>
                <div className="text-sm text-gray-500">{panelist.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}
