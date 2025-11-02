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
  Phone
} from "lucide-react";
import { createClient } from '@/lib/supabase/api/client';
import { useAuthStore } from '@/store/auth-store';

interface Candidate {
    application_id: string;
    first_name: string;
    last_name: string;
    email: string;
    job_title: string;
    created_at: string;
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
  meetingPlatform: "google" | "teams" | "zoom" | "";
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
  const { schoolId } = useAuthStore();
  const [scheduleForm, setScheduleForm] = useState<ScheduleInterviewForm>({
    date: '',
    time: '',
    duration: '',
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
  const panelistInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [panelistDropdownPosition, setPanelistDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

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
        location: value === "online" ? "" : (schoolInfo?.address || ""),
        meetingPlatform: value === "online" ? "google" : ""
      };
      return updatedForm;
    });
  };

  // Function to handle meeting platform change
  const handleMeetingPlatformChange = (platform: "google" | "teams" | "zoom" | "") => {
    setScheduleForm(prev => {
      const updatedForm: ScheduleInterviewForm = {
        ...prev,
        meetingPlatform: platform,
        location: platform === "google" ? "Google Meet link will be generated automatically" : 
                 platform === "teams" ? "Microsoft Teams link will be generated automatically" : 
                 platform === "zoom" ? "Zoom link will be generated automatically" : ""
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

  // Function to generate Google Meet link (simulated)
  const generateGoogleMeetLink = () => {
    // In a real implementation, this would call an API to create a Google Meet link
    // For now, we'll generate a placeholder link
    if (scheduleForm.meetingType === "online" && candidate) {
      // This would typically be an API call to your backend which would:
      // 1. Use Google Calendar API or Google Meet API to create a meeting
      // 2. Include the candidate's email and panelists in the meeting invitation
      // 3. Return the meeting link
      
      // Simulated link for demonstration
      const meetingId = `hyrepro-${Date.now()}`;
      return `https://meet.google.com/${meetingId}`;
    }
    return "";
  };

  // Function to handle saving the interview schedule
  const handleSaveSchedule = () => {
    // Here you would typically make an API call to save the schedule
    console.log('Scheduling interview for:', candidate);
    console.log('Schedule details:', scheduleForm);
    
    // If it's an online meeting, generate the Google Meet link
    if (scheduleForm.meetingType === "online" && candidate) {
      const meetLink = generateGoogleMeetLink();
      console.log('Generated Google Meet link:', meetLink);
      // In a real implementation, you would send this link to the candidate and panelists via email
    }
    
    // Close the dialog after saving
    onClose();
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
        className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Schedule Interview</SheetTitle>
          <SheetDescription>
            Schedule an interview for {candidate?.first_name} {candidate?.last_name}
          </SheetDescription>
        </SheetHeader>
        
        {/* Candidate Details Section */}
        {candidate && (
          <div className="border rounded-lg p-4 mb-6 bg-gray-50">
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
        
        <div className="grid gap-4 p-4">
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
          
          {/* Online Meeting Platform Selection */}
          {scheduleForm.meetingType === "online" && (
            <div className="grid gap-2">
              <Label>Meeting Platform</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={scheduleForm.meetingPlatform === "google" ? "default" : "outline"}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => handleMeetingPlatformChange("google")}
                >
                  <Video className="w-5 h-5" />
                  <span className="text-xs">Google Meet</span>
                </Button>
                <Button
                  type="button"
                  variant={scheduleForm.meetingPlatform === "teams" ? "default" : "outline"}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => handleMeetingPlatformChange("teams")}
                >
                  <Mic className="w-5 h-5" />
                  <span className="text-xs">Microsoft Teams</span>
                </Button>
                <Button
                  type="button"
                  variant={scheduleForm.meetingPlatform === "zoom" ? "default" : "outline"}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => handleMeetingPlatformChange("zoom")}
                >
                  <Phone className="w-5 h-5" />
                  <span className="text-xs">Zoom</span>
                </Button>
              </div>
            </div>
          )}
          
          {/* Location/Meeting Link Input */}
          <div className="grid gap-2">
            <Label htmlFor="location">
              {scheduleForm.meetingType === "online" ? "Meeting Link" : "Location"}
            </Label>
            <div className="relative">
              {scheduleForm.meetingType === "online" ? (
                <>
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="location"
                    className="pl-10"
                    value={scheduleForm.location}
                    readOnly
                  />
                </>
              ) : (
                <>
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="location"
                    className="pl-10"
                    value={scheduleForm.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="Enter interview location"
                  />
                </>
              )}
            </div>
            {scheduleForm.meetingType === "online" && scheduleForm.meetingPlatform && (
              <p className="text-sm text-gray-500">
                {scheduleForm.meetingPlatform === "google" && "Google Meet link will be generated automatically and sent to candidate and panelists"}
                {scheduleForm.meetingPlatform === "teams" && "Microsoft Teams link will be generated automatically and sent to candidate and panelists"}
                {scheduleForm.meetingPlatform === "zoom" && "Zoom link will be generated automatically and sent to candidate and panelists"}
              </p>
            )}
            {scheduleForm.meetingType === "offline" && schoolInfo?.address && (
              <p className="text-sm text-gray-500">
                Default location from school address
              </p>
            )}
          </div>
          
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
        
        <div className="flex justify-end gap-2 mt-4 p-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveSchedule}>Schedule Interview</Button>
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