'use client'
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, Briefcase, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/api/client'

// Fetcher function - reusable and testable
const fetchSchoolInfo = async (userId: string) => {
  if (!userId) return null
  
  const supabase = createClient()
  const { data, error } = await supabase
    .from('admin_user_info')
    .select('school_id')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data?.school_id || null
}

export default function Page() {
  const { user } = useAuth()
  
  // SWR handles caching, revalidation, and loading states
  const { data: schoolId, error, isLoading } = useSWR(
    user?.id ? ['school-info', user.id] : null,
    ([_, userId]) => fetchSchoolInfo(userId),
    {
      revalidateOnFocus: false, // Don't refetch on window focus
      dedupingInterval: 60000, // Cache for 1 minute
    }
  )

  return (
    <AuthGuard>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <Card>
              <CardHeader>
                <CardTitle>School Information</CardTitle>
                <CardDescription>
                  {isLoading ? (
                    <p>Loading school information...</p>
                  ) : error ? (
                    <p className="text-destructive">Error loading school information: {user?.id || 'Unknown user'}</p>
                  ) : schoolId ? (
                    <p>School ID: {schoolId}</p>
                  ) : (
                    <p>No school assigned to this account</p>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {schoolId && (
                  <div className="text-sm text-muted-foreground">
                    <p>This is your organization&apos;s unique identifier in our system.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}