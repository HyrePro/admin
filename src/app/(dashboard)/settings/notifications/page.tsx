'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/api/client';
import { toast } from "sonner";
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { ItemDescription, ItemTitle } from '@/components/ui/item';

interface NotificationSettings {
  // Admin Notifications
  newTeacherApplication: boolean;
  interviewScheduled: boolean;
  assessmentCompleted: boolean;
  
  // Email & SMS Preferences
  receiveDailySummary: boolean;
  sendApplicantUpdates: boolean;
  
  // Push Notifications
  allowBrowserNotifications: boolean;
}



export default function NotificationsPage() {
  const { user } = useAuth();
  const { schoolId, setSchoolId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  
  const [settings, setSettings] = useState<NotificationSettings>({
    // Admin Notifications
    newTeacherApplication: true,
    interviewScheduled: true,
    assessmentCompleted: true,
    
    // Email & SMS Preferences
    receiveDailySummary: true,
    sendApplicantUpdates: true,
    
    // Push Notifications
    allowBrowserNotifications: false,
  });

  // Fetch school_id if it's null
  useEffect(() => {
    const fetchSchoolId = async () => {
      if (!user?.id) return;
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('admin_user_info')
          .select('school_id')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data?.school_id) {
          setSchoolId(data.school_id);
        } else {
          // Redirect to select organization if school_id is missing
          router.push('/select-organization');
        }
      } catch (error) {
        console.error('Error fetching school info:', error);
        toast.error('Failed to load organization information');
        router.push('/select-organization');
      }
    };
    
    if (!schoolId && user?.id) {
      fetchSchoolId();
    }
  }, [schoolId, user?.id, setSchoolId, router]);

  // Fetch notification settings from Supabase
  useEffect(() => {
    const fetchNotificationSettings = async () => {
      if (!schoolId) return;
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('school_info')
          .select('notification_settings')
          .eq('id', schoolId)
          .single();
        
        if (error) throw error;
        
        if (data?.notification_settings) {
          setSettings(prev => ({
            ...prev,
            ...data.notification_settings
          }));
        }
      } catch (error) {
        console.error('Error fetching notification settings:', error);
        // Not showing error to user as this is optional
      } finally {
        setLoading(false);
      }
    };
    
    if (schoolId) {
      fetchNotificationSettings();
    }
  }, [schoolId]);

  // Handle toggle change
  const handleToggleChange = (field: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // Save notification settings
  const handleSaveSettings = async () => {
    if (!schoolId) return;
    
    setSaving(true);
    const toastId = toast.loading('Saving notification preferences...');
    
    try {
      const supabase = createClient();
      
      // Update school info with notification settings
      const { error } = await supabase
        .from('school_info')
        .update({ notification_settings: settings })
        .eq('id', schoolId);
      
      if (error) throw error;
      
      toast.success('Notification preferences saved successfully!', { id: toastId });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save notification preferences. Please try again.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // Show loading state if schoolId is not available yet
  if (!schoolId) {
    return (
      <div className="space-y-6 p-4" >
        <div>
          <h3 className="text-lg font-medium">Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Loading organization information...
          </p>
        </div>
        <Card>
          <CardContent className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="bg-white rounded-lg border p-4">
        <div className="space-y-4">
          <div>
            <ItemTitle>Notifications</ItemTitle>
            <ItemDescription>
              Configure who gets what alerts.
            </ItemDescription>
      
    </div>
        <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="receiveDailySummary" className="text-sm font-medium">
                                  Receive daily summary emails
                               </Label>
                <p className="text-sm text-muted-foreground">Get a daily summary of activities</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.receiveDailySummary}
                  onChange={(e) => handleToggleChange('receiveDailySummary', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                 <Label htmlFor="sentApplicationUpdate" className="text-sm font-medium">Send applicant updates automatically</Label>
                <p className="text-sm text-muted-foreground">Automatically send updates to applicants</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.sendApplicantUpdates}
                  onChange={(e) => handleToggleChange('sendApplicantUpdates', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                 <Label htmlFor="receiveDailySummary" className="text-sm font-medium">New teacher application</Label>
                <p className="text-sm text-muted-foreground">When a new teacher application is submitted</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.newTeacherApplication}
                  onChange={(e) => handleToggleChange('newTeacherApplication', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                 <Label htmlFor="receiveDailySummary" className="text-sm font-medium">Interview scheduled</Label>
                <p className="text-sm text-muted-foreground">When an interview is scheduled</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.interviewScheduled}
                  onChange={(e) => handleToggleChange('interviewScheduled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="assessmentCompleted" className="text-sm font-medium">Assessment completed</Label>
                <p className="text-sm text-muted-foreground">When an assessment is completed</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.assessmentCompleted}
                  onChange={(e) => handleToggleChange('assessmentCompleted', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
          </div>
        </div>
      
    </div>
    </div>
  );
}