'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/api/client'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Copy, Eye, AlertCircle } from 'lucide-react'
import { formatDate, DatePresets } from '@/lib/date-formatter'

interface MonitoredJob {
  id: string
  title: string
  status: string
  subjects: string[]
  grade_levels: string[]
  created_at: string
  job_type?: string
  mode?: string
  salary_range?: string
  application_analytics: {
    total_applications: number
    assessment: number
    demo: number
    interviews: number
    offered: number
  }
}

interface Props {
  schoolId?: string
  jobID?: string
  refreshInterval?: number
}

const statusMap: Record<string, { label: string; description: string }> = {
  OPEN: {
    label: 'Live',
    description: 'Your job is live. Teachers can now discover and apply for this position.',
  },
  IN_PROGRESS: {
    label: 'Processing',
    description: 'Your job post is being reviewed and set up. It will go live shortly.',
  },
  COMPLETED: {
    label: 'Completed',
    description: 'Hiring for this position has been completed.',
  },
  SUSPENDED: {
    label: 'Suspended',
    description: 'This job post has been suspended. Please contact support for details.',
  },
  PAUSED: {
    label: 'Paused',
    description: 'You have paused this job post. Resume it when you are ready to continue.',
  },
  APPEALED: {
    label: 'Under Review',
    description: 'This job post is currently under review.',
  },
}

export default function JobStatusMonitor({
  schoolId,
  jobID,
  refreshInterval = 30000,
}: Props) {
  const [jobs, setJobs] = useState<MonitoredJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [copied, setCopied] = useState(false)

  const supabaseRef = useRef<any>(null)
  const channelRef = useRef<any>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const fetchJobs = async () => {
    if (!schoolId) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          status,
          subjects,
          grade_levels,
          created_at,
          job_type,
          mode,
          salary_range
        `)
        .eq('id', jobID)
        .order('created_at', { ascending: false })

      if (error) throw error

      setJobs(
        (data ?? []).map(j => ({
          ...j,
          application_analytics: {
            total_applications: 0,
            assessment: 0,
            demo: 0,
            interviews: 0,
            offered: 0,
          },
        })),
      )
      setLastUpdated(new Date())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtime = () => {
    if (channelRef.current) return

    supabaseRef.current = createClient()
    const filter = `id=eq.${jobID}`

    channelRef.current = supabaseRef.current
      .channel('jobs-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs', filter },
        (payload: { eventType: string; old: { id: string }; new: any }) => {
          setJobs(prev => {
            if (payload.eventType === 'DELETE') {
              return prev.filter(j => j.id !== payload.old.id)
            }

            const incoming = payload.new
            const idx = prev.findIndex(j => j.id === incoming.id)

            const normalized: MonitoredJob = {
              ...incoming,
              application_analytics: {
                total_applications: 0,
                assessment: 0,
                demo: 0,
                interviews: 0,
                offered: 0,
              },
            }

            if (idx === -1) return [normalized, ...prev]
            const copy = [...prev]
            copy[idx] = normalized
            return copy
          })

          setLastUpdated(new Date())
        },
      )
      .subscribe((status: string) => {
        const ok = status === 'SUBSCRIBED'
        setConnected(ok)

        if (ok && pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
        }

        if (!ok && !pollRef.current) {
          pollRef.current = setInterval(fetchJobs, refreshInterval)
        }
      })
  }

  const handleCopy = async (jobId: string) => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/jobs/${jobId}`,
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  useEffect(() => {
    fetchJobs()
    setupRealtime()

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [schoolId])

  // ===================== Loading State =====================
  if (loading && !jobs.length) {
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-200 px-5 py-4">
        <Skeleton className="h-4 w-64" />
      </div>
    )
  }

  // ===================== Render =====================
  return (
    <div>
      {jobs.map(job => {
        const isLive = job.status === 'OPEN'
        const status = statusMap[job.status] ?? statusMap['IN_PROGRESS']

        return (
          <div
            key={job.id}
            className={`rounded-lg border px-5 py-4 ${
              isLive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <p className={`text-sm ${isLive ? 'text-green-800' : 'text-gray-600'}`}>
              {status.description}
            </p>
          </div>
        )
      })}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 mt-2">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}