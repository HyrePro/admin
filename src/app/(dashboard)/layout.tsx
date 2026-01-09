"use client"

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/api/client";
import { NavUser } from "@/components/nav-user";
import { Badge } from "@/components/ui/badge";
import { AuthProviderWrapper } from "@/components/auth-provider-wrapper";
import { I18nProvider } from "@/contexts/i18n-context";

// Interface for school information
interface SchoolInfo {
  name: string;
  location: string;
}

export default function DashboardShellLayout({ children }: { children: React.ReactNode; }) {
  return (
    <AuthProviderWrapper>
      <I18nProvider>
        <DashboardShellLayoutContent>
          {children}
        </DashboardShellLayoutContent>
      </I18nProvider>
    </AuthProviderWrapper>
  );
}

function DashboardShellLayoutContent({ children }: { children: React.ReactNode; }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState<string | null>(null);
  const [loadingJobTitle, setLoadingJobTitle] = useState(false);
  const [loadingCandidateName, setLoadingCandidateName] = useState(false);
  // New state for checking school_id
  const [checkingSchoolId, setCheckingSchoolId] = useState(true);
  const [hasSchoolId, setHasSchoolId] = useState<boolean | null>(null);
  // State for school information
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  // State to track if initial auth check has been done
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);

  // Extract job ID and application ID from pathname
  const { jobId, applicationId } = useMemo(() => {
    const jobsMatch = pathname.match(/^\/jobs\/([^/]+)$/);
    const applicationMatch = pathname.match(/^\/jobs\/([^/]+)\/([^/]+)$/);

    if (applicationMatch) {
      return {
        jobId: applicationMatch[1],
        applicationId: applicationMatch[2]
      };
    } else if (jobsMatch) {
      return {
        jobId: jobsMatch[1],
        applicationId: null
      };
    }

    return { jobId: null, applicationId: null };
  }, [pathname]);

  // Fetch school information
  const fetchSchoolInfo = useCallback(async (schoolId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('school_info')
        .select('name, location')
        .eq('id', schoolId)
        .single();

      if (error) {
        console.error("Error fetching school info:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Error fetching school info:", err);
      return null;
    }
  }, []);

  // Check if user has school_id and fetch school information
  const checkSchoolId = useCallback(async () => {
    if (!user || loading || initialAuthCheckDone) return;

    setCheckingSchoolId(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('admin_user_info')
        .select('school_id')
        .eq('id', user.id)
        .single();

      // If there's an error or no data, redirect to select-organization
      // This handles cases where user doesn't exist in admin_user_info table yet
      if (error || !data) {
        console.warn("User not found in admin_user_info or error occurred:", error || "No data returned");
        setHasSchoolId(false);
        router.replace("/select-organization");
        return;
      }

      const schoolIdExists = !!data.school_id;
      setHasSchoolId(schoolIdExists);

      // If user doesn't have school_id, redirect to select-organization
      if (!schoolIdExists) {
        router.replace("/select-organization");
        return;
      }

      // Fetch school information
      const schoolData = await fetchSchoolInfo(data.school_id);
      setSchoolInfo(schoolData);
    } catch (err) {
      console.error("Unexpected error checking school ID:", err);
      // On any error, redirect to select-organization for safety
      setHasSchoolId(false);
      router.replace("/select-organization");
      return;
    } finally {
      setCheckingSchoolId(false);
      setInitialAuthCheckDone(true);
    }
  }, [user, loading, initialAuthCheckDone, router, fetchSchoolInfo]);

  useEffect(() => {
    checkSchoolId();
  }, [user, loading, initialAuthCheckDone]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication or school_id
  if (loading || !user || checkingSchoolId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If user doesn't have school_id, don't render dashboard content
  if (hasSchoolId === false) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        {/* Fixed Header */}
        <header className="shrink-0 flex h-18 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16 border-b border-gray-200 dark:border-gray-800 z-50">
          <div className="lg:hidden">
            <SidebarTrigger className="ml-2" />
          </div>
          <div className="flex px-2 items-center ms-2 min-w-0">
            <div className="font-medium text-gray-900 text-md truncate">
              {schoolInfo ? `${schoolInfo.name}, ${schoolInfo.location}` : "Loading school info..."}
            </div>
            <Badge variant="outline" className="text-xs ms-2">
              FREE PLAN
            </Badge>
          </div>
          <div className="ml-auto flex items-center gap-4 px-4">
            {/* <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Messages" className="hover:bg-gray-200">
                  <MessageSquare className="size-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="font-medium">Messages</div>
                  <button className="text-xs text-primary hover:underline">New message</button>
                </div>
                <div className="max-h-80 overflow-auto divide-y">
                  <div className="p-3 hover:bg-accent/40 cursor-pointer">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>Recruiter - Greenfield High</span>
                      <span className="text-[11px] text-muted-foreground">5m</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Hi! Thanks for applying. Are you available for a quick call tomorrow?</div>
                  </div>
                </div>
                <div className="p-2 text-center text-xs text-muted-foreground border-t">
                  View all messages
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications" className="hover:bg-gray-200 relative">
                  <Bell className="size-5" />
                  <span className="absolute right-2 top-2 inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="font-medium">Notifications</div>
                  <button className="text-xs text-primary hover:underline">Mark all as read</button>
                </div>
                <div className="max-h-80 overflow-auto divide-y">
                  <div className="p-3 hover:bg-accent/40 cursor-pointer">
                    <div className="text-sm font-medium">Application update</div>
                    <div className="text-xs text-muted-foreground">Your Math Teacher application status changed to Under Review.</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">2h ago</div>
                  </div>
                </div>
                <div className="p-2 text-center text-xs text-muted-foreground border-t">
                  View all notifications
                </div>
              </PopoverContent>
            </Popover> */}
            {user && user.email ? (
              <NavUser user={{
                name: user.user_metadata?.name || user.email.split('@')[0] || 'User',
                email: user.email,
                avatar: user.user_metadata?.avatar_url || '',
              }} />
            ) : null}
          </div>
        </header>

        {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
  {children}
</div>

      </SidebarInset>
    </SidebarProvider>
  );
}