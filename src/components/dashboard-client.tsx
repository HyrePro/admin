'use client';

import { useAuth } from '@/context/auth-context';
import { useDashboardData } from '@/hooks/useDashboard';
import { DashboardContent } from '@/app/(dashboard)/dashboard-content';
import DashboardLoading from '@/app/(dashboard)/loading';

export function DashboardClient() {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    schoolId,
    jobs,
    dashboardStats,
    isLoading,
    isError,
    refetchAll,
  } = useDashboardData(userId || '');

  // Show loading state while fetching data
  if (isLoading) {
    return <DashboardLoading />;
  }

  // Show error state if there was an error fetching data
  if (isError) {
    return (
      <DashboardContent 
        schoolId={schoolId || null} 
        jobs={jobs} 
        dashboardStats={dashboardStats} 
        error={true} 
      />
    );
  }

  // Render the dashboard content with the fetched data
  return (
    <DashboardContent 
      schoolId={schoolId || null} 
      jobs={jobs} 
      dashboardStats={dashboardStats || null} 
      error={false} 
    />
  );
}