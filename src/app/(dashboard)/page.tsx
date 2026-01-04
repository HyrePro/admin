import { createClient } from '@/lib/supabase/api/server'
import { DashboardContent } from './dashboard-content'

interface DashboardStats {
  total_applications: number
  interview_ready: number
  offered: number
}

// Server-side data fetching functions
async function getSchoolInfo(userId: string) {
  if (!userId) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('admin_user_info')
    .select('school_id')
    .eq('id', userId)
    .single()

  if (error) throw error
  // Ensure the returned data is serializable
  return data?.school_id ? JSON.parse(JSON.stringify(data?.school_id)) : null
}

async function getJobs(schoolId: string) {
  if (!schoolId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('jobs')
    .select('id')
    .eq('school_id', schoolId)

  if (error) throw error
  // Ensure the returned data is serializable
  return data ? JSON.parse(JSON.stringify(data)) : []
}

async function getDashboardStats(schoolId: string): Promise<DashboardStats | null> {
  if (!schoolId) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('get_school_dashboard_stats', { p_school_id: schoolId })
    .single()

  if (error) throw error
  // Ensure the returned data is serializable
  return data ? JSON.parse(JSON.stringify(data)) : null
}

// Server component that fetches data
export default async function Page() {
  // Get current user session
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  
  if (!userId) {
    // If not authenticated, redirect will be handled by middleware
    return <div>Redirecting...</div>
  }
  
  // Fetch all required data on the server
  let schoolId, jobs, dashboardStats
  
  try {
    schoolId = await getSchoolInfo(userId)
    
    if (schoolId) {
      jobs = await getJobs(schoolId)
      dashboardStats = await getDashboardStats(schoolId)
    } else {
      jobs = []
      dashboardStats = null
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Return error state to client component
    return <DashboardContent error={true} /> 
  }
  
  // Pass the serialized data to the client component
  return <DashboardContent 
    schoolId={schoolId ? JSON.parse(JSON.stringify(schoolId)) : null}
    jobs={jobs ? JSON.parse(JSON.stringify(jobs)) : []}
    dashboardStats={dashboardStats ? JSON.parse(JSON.stringify(dashboardStats)) : null}
  />
}


