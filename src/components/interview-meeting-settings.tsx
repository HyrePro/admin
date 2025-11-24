'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Plus, X } from "lucide-react";
import { createClient } from '@/lib/supabase/api/client';
import { toast } from "sonner";
import { useAuthStore } from '@/store/auth-store';

interface Panelist {
  id: string;
  name: string;
  email: string;
}

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

interface InterviewMeetingSettingsProps {
  schoolId: string;
}

export function InterviewMeetingSettings({ schoolId }: InterviewMeetingSettingsProps) {
  const [defaultPanelists, setDefaultPanelists] = useState<Panelist[]>([]);
  const [newPanelist, setNewPanelist] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Interview settings state
  const [interviewSettings, setInterviewSettings] = useState<InterviewSettingsData>({
    default_interview_type: 'in-person',
    default_duration: '30',
    buffer_time: '15',
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    candidate_reminder_hours: '24',
    interviewer_reminder_hours: '1',
    custom_instructions: 'Please arrive 10 minutes early for your interview.'
  });
  
  const [settingsErrors, setSettingsErrors] = useState<Partial<InterviewSettingsData>>({});

  // Fetch default panelists from Supabase
  useEffect(() => {
    const fetchPanelists = async () => {
      if (!schoolId) return;
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('interview_panelists')
          .select('*')
          .eq('school_id', schoolId);
        
        if (error) throw error;
        
        setDefaultPanelists(data || []);
      } catch (error) {
        console.error('Error fetching panelists:', error);
        toast.error('Failed to load panelists');
      } finally {
        setLoading(false);
      }
    };
    
    if (schoolId) {
      fetchPanelists();
    }
  }, [schoolId]);

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
            ...data.interview_settings
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

  // Add a new default panelist
  const handleAddPanelist = async () => {
    if (!schoolId) {
      toast.error('Organization information not available. Please try again.');
      return;
    }
    
    if (!newPanelist.name.trim() || !newPanelist.email.trim()) {
      toast.error('Please enter both name and email');
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newPanelist.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('interview_panelists')
        .insert({
          school_id: schoolId,
          name: newPanelist.name,
          email: newPanelist.email
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setDefaultPanelists(prev => [...prev, data]);
      setNewPanelist({ name: '', email: '' });
      toast.success('Panelist added successfully');
    } catch (error) {
      console.error('Error adding panelist:', error);
      toast.error('Failed to add panelist');
    }
  };

  // Remove a default panelist
  const handleRemovePanelist = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('interview_panelists')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setDefaultPanelists(prev => prev.filter(panelist => panelist.id !== id));
      toast.success('Panelist removed successfully');
    } catch (error) {
      console.error('Error removing panelist:', error);
      toast.error('Failed to remove panelist');
    }
  };

  // Handle interview settings change
  const handleSettingsChange = (field: keyof InterviewSettingsData, value: string) => {
    setInterviewSettings(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (settingsErrors[field]) {
      setSettingsErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate interview settings
  const validateSettings = (): boolean => {
    const newErrors: Partial<InterviewSettingsData> = {};
    
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
    
    // Validate working hours
    const startHour = parseInt(interviewSettings.working_hours_start.split(':')[0]);
    const endHour = parseInt(interviewSettings.working_hours_end.split(':')[0]);
    
    if (startHour >= endHour) {
      newErrors.working_hours_start = 'Start time must be before end time';
      newErrors.working_hours_end = 'End time must be after start time';
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

  return (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="text-lg font-medium">Meeting Settings</h3>
        <p className="text-sm text-muted-foreground">
          Control the default interview workflow for new job posts
        </p>
      </div>
      
      {/* Interview Type & Duration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Type & Duration</CardTitle>
          <CardDescription>
            Configure the default interview type and duration for new job posts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="default_interview_type">Default Interview Type</Label>
              <Select 
                value={interviewSettings.default_interview_type} 
                onValueChange={(value) => handleSettingsChange('default_interview_type', value as unknown as string)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interview type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-person">In-person</SelectItem>
                  <SelectItem value="online">Online (Google Meet / Zoom)</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="default_duration">Default Interview Duration (minutes)</Label>
              <Input
                id="default_duration"
                type="number"
                min="1"
                value={interviewSettings.default_duration}
                onChange={(e) => handleSettingsChange('default_duration', e.target.value)}
                className={settingsErrors.default_duration ? 'border-red-500' : ''}
              />
              {settingsErrors.default_duration && (
                <p className="text-sm text-red-600">{settingsErrors.default_duration}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Scheduling Window Card */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduling Window</CardTitle>
          <CardDescription>
            Configure scheduling preferences for interviews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="buffer_time">Buffer Between Interviews (minutes)</Label>
              <Input
                id="buffer_time"
                type="number"
                min="0"
                value={interviewSettings.buffer_time}
                onChange={(e) => handleSettingsChange('buffer_time', e.target.value)}
                className={settingsErrors.buffer_time ? 'border-red-500' : ''}
              />
              {settingsErrors.buffer_time && (
                <p className="text-sm text-red-600">{settingsErrors.buffer_time}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="working_hours_start">Working Hours Start</Label>
              <Input
                id="working_hours_start"
                type="time"
                value={interviewSettings.working_hours_start}
                onChange={(e) => handleSettingsChange('working_hours_start', e.target.value)}
                className={settingsErrors.working_hours_start ? 'border-red-500' : ''}
              />
              {settingsErrors.working_hours_start && (
                <p className="text-sm text-red-600">{settingsErrors.working_hours_start}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="working_hours_end">Working Hours End</Label>
              <Input
                id="working_hours_end"
                type="time"
                value={interviewSettings.working_hours_end}
                onChange={(e) => handleSettingsChange('working_hours_end', e.target.value)}
                className={settingsErrors.working_hours_end ? 'border-red-500' : ''}
              />
              {settingsErrors.working_hours_end && (
                <p className="text-sm text-red-600">{settingsErrors.working_hours_end}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Reminders & Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Reminders & Instructions</CardTitle>
          <CardDescription>
            Configure reminder settings and custom instructions for interviews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="candidate_reminder_hours">Send Reminder to Candidate (hours before)</Label>
              <Input
                id="candidate_reminder_hours"
                type="number"
                min="0"
                value={interviewSettings.candidate_reminder_hours}
                onChange={(e) => handleSettingsChange('candidate_reminder_hours', e.target.value)}
                className={settingsErrors.candidate_reminder_hours ? 'border-red-500' : ''}
              />
              {settingsErrors.candidate_reminder_hours && (
                <p className="text-sm text-red-600">{settingsErrors.candidate_reminder_hours}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="interviewer_reminder_hours">Send Reminder to Interviewer (hours before)</Label>
              <Input
                id="interviewer_reminder_hours"
                type="number"
                min="0"
                value={interviewSettings.interviewer_reminder_hours}
                onChange={(e) => handleSettingsChange('interviewer_reminder_hours', e.target.value)}
                className={settingsErrors.interviewer_reminder_hours ? 'border-red-500' : ''}
              />
              {settingsErrors.interviewer_reminder_hours && (
                <p className="text-sm text-red-600">{settingsErrors.interviewer_reminder_hours}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="custom_instructions">Custom Instructions</Label>
            <Textarea
              id="custom_instructions"
              placeholder="Message shown to candidate before interview"
              value={interviewSettings.custom_instructions}
              onChange={(e) => handleSettingsChange('custom_instructions', e.target.value)}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              This message will be shown to candidates before their interview
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Default Panelists Card */}
      <Card>
        <CardHeader>
          <CardTitle>Default Panelists</CardTitle>
          <CardDescription>
            Add panelists who are frequently involved in interviews. They will be available for quick selection when scheduling interviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new panelist form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newPanelist.name}
                onChange={(e) => setNewPanelist(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Panelist name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newPanelist.email}
                onChange={(e) => setNewPanelist(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Panelist email"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddPanelist} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Panelist
              </Button>
            </div>
          </div>
          
          {/* Panelists list */}
          <div className="space-y-2">
            <h4 className="font-medium">Saved Panelists</h4>
            {loading ? (
              <p>Loading panelists...</p>
            ) : defaultPanelists.length === 0 ? (
              <p className="text-muted-foreground">No panelists added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {defaultPanelists.map((panelist) => (
                  <div 
                    key={panelist.id} 
                    className="flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{panelist.name} ({panelist.email})</span>
                    <button 
                      type="button"
                      onClick={() => handleRemovePanelist(panelist.id)}
                      className="text-blue-800 hover:text-blue-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}