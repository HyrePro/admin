'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { fetchUserApplicationInfo, type UserApplicationInfo } from '@/lib/supabase/api/fetch-user-application-info'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function Page() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserApplicationInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const { data } = await fetchUserApplicationInfo()
        if (mounted) setProfile(data)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [])

  const firstName = profile?.first_name ?? (user?.user_metadata?.first_name as string | undefined) ?? ''
  const lastName = profile?.last_name ?? (user?.user_metadata?.last_name as string | undefined) ?? ''
  const displayName = useMemo(() => {
    const name = `${firstName} ${lastName}`.trim()
    if (name) return name
    return (user?.user_metadata?.name as string | undefined) || (user?.email?.split('@')[0] ?? 'User')
  }, [firstName, lastName, user])

  const initials = useMemo(() => {
    const f = firstName?.[0] ?? ''
    const l = lastName?.[0] ?? ''
    const fromName = (displayName?.[0] ?? '')
    const res = (f + l) || fromName
    return res.toUpperCase() || 'U'
  }, [firstName, lastName, displayName])

  const email = profile?.email || user?.email || '-'
  const phone = profile?.phone_number || '-'
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) || ''

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar className="h-14 w-14">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-lg font-semibold truncate">{displayName}</div>
                <div className="text-sm text-muted-foreground truncate">
                  <span>{email}</span>
                  <span className="px-2">|</span>
                  <span>{phone}</span>
                </div>
              </div>
            </div>
            <div>
              <Button asChild>
                <Link href="/dashboard/settings">Edit Profile</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="mt-1">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="preference">Preference</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="py-6">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading profile...</div>
              ) : profile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">First name</div>
                    <div className="font-medium">{profile.first_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Last name</div>
                    <div className="font-medium">{profile.last_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Email</div>
                    <div className="font-medium">{profile.email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Phone</div>
                    <div className="font-medium">{profile.phone_number || '-'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">City</div>
                    <div className="font-medium">{profile.city || '-'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">State</div>
                    <div className="font-medium">{profile.state || '-'}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No profile data yet.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preference" className="mt-4">
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Preferences content coming soon.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

