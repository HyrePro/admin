'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/api/client';
import { toast } from "sonner";
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { ItemDescription, ItemTitle } from '@/components/ui/item';
import dynamic from "next/dynamic";

// Dynamically import heavy components to reduce initial bundle size
const InterviewRubricsSettings = dynamic(() => import("@/components/interview-rubrics-settings").then(mod => mod.InterviewRubricsSettings), {
  ssr: false,
  loading: () => (
    <div className="p-4 space-y-4">
      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
});

const InterviewMeetingSettings = dynamic(() => import("@/components/interview-meeting-settings").then(mod => mod.InterviewMeetingSettings), {
  ssr: false,
  loading: () => (
    <div className="p-4 space-y-4">
      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
});

export default function InterviewSettingsPage() {
  const { user } = useAuth();
  const { schoolId, setSchoolId } = useAuthStore();
  const router = useRouter();
  
  // Sidebar state
  const [activeSection, setActiveSection] = useState<'meeting' | 'rubrics'>('meeting');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  // Show loading state if schoolId is not available yet
  if (!schoolId) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Interview Settings</h3>
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
    <div className="flex h-full">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-auto'} border-r border-gray-200 flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!sidebarCollapsed && <h3 className="text-lg font-medium">Interview Settings</h3>}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded-md hover:bg-gray-100"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              // Settings icon when collapsed
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            ) : (
              // X icon when expanded
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
              </svg>
            )}
          </button>
        </div>
        {!sidebarCollapsed && (
          <nav className="flex-1 p-2 overflow-y-auto min-w-[200px]">
            <button
              onClick={() => setActiveSection('meeting')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium mb-1 flex items-center ${
                activeSection === 'meeting'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-check mr-2">
                <path d="M8 2v4"/>
                <path d="M16 2v4"/>
                <rect width="18" height="18" x="3" y="4" rx="2"/>
                <path d="M3 10h18"/>
                <path d="m9 16 2 2 4-4"/>
              </svg>
              Meeting
            </button>
            <button
              onClick={() => setActiveSection('rubrics')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                activeSection === 'rubrics'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text mr-2">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
                <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                <path d="M10 9H8"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
              </svg>
              Rubrics
            </button>
          </nav>
        )}
        {sidebarCollapsed && (
          <nav className="flex-1 p-2 overflow-y-auto flex flex-col items-center space-y-4 mt-4">
            <button
              onClick={() => setActiveSection('meeting')}
              className={`p-2 rounded-md ${
                activeSection === 'meeting'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              aria-label="Meeting"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-check">
                <path d="M8 2v4"/>
                <path d="M16 2v4"/>
                <rect width="18" height="18" x="3" y="4" rx="2"/>
                <path d="M3 10h18"/>
                <path d="m9 16 2 2 4-4"/>
              </svg>
            </button>
            <button
              onClick={() => setActiveSection('rubrics')}
              className={`p-2 rounded-md ${
                activeSection === 'rubrics'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              aria-label="Rubrics"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
                <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                <path d="M10 9H8"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
              </svg>
            </button>
          </nav>
        )}
      </div>
      
      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Meeting Content */}
        {activeSection === 'meeting' && (
          <InterviewMeetingSettings 
            schoolId={schoolId || ''} 
            onNavigateAway={() => setActiveSection('rubrics')}
          />
        )}
        
        {/* Rubrics Content - Using the new component */}
        {activeSection === 'rubrics' && (
          <InterviewRubricsSettings />
        )}
      </div>
    </div>
  );
}