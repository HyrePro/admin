"use client"

import { useEffect, useState } from "react"
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/api/client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const SCHOOL_ID = "2317e986-3ebe-415e-b402-849d80f714a0"

type Stat = {
  total: number
  thisMonth: number
  lastMonth: number
  percentChange: number
}

export function SectionCards() {
  const [stats, setStats] = useState<{
    jobs: Stat
    applications: Stat
    interviews: Stat
    offers: Stat
  }>({
    jobs: { total: 0, thisMonth: 0, lastMonth: 0, percentChange: 0 },
    applications: { total: 0, thisMonth: 0, lastMonth: 0, percentChange: 0 },
    interviews: { total: 0, thisMonth: 0, lastMonth: 0, percentChange: 0 },
    offers: { total: 0, thisMonth: 0, lastMonth: 0, percentChange: 0 },
  })

  useEffect(() => {
    const fetchStats = async () => {
      // Create a Supabase client instance
      const supabase = createClient();
      
      const now = new Date()
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0) // last day prev month

      const thisMonthISO = firstDayThisMonth.toISOString()
      const lastMonthStartISO = firstDayLastMonth.toISOString()
      const lastMonthEndISO = endLastMonth.toISOString()

      // Utility: get total + monthly counts
      const getCounts = async (
        table: string,
        filters: Record<string, unknown>,
        status?: string
      ) => {
        const queryBase = supabase.from(table)

        // Total
        const { count: total } = await queryBase
          .select("*", { count: "exact", head: true })
          .match(filters)
          .maybeSingle()

        // This month
        let qThis = supabase.from(table).select("*", { count: "exact", head: true }).match(filters)
        if (status) qThis = qThis.eq("status", status)
        const { count: thisMonth } = await qThis.gte("created_at", thisMonthISO)

        // Last month
        let qLast = supabase.from(table).select("*", { count: "exact", head: true }).match(filters)
        if (status) qLast = qLast.eq("status", status)
        const { count: lastMonth } = await qLast
          .gte("created_at", lastMonthStartISO)
          .lte("created_at", lastMonthEndISO)

        const percentChange =
          lastMonth && lastMonth > 0
            ? ((thisMonth! - lastMonth) / lastMonth) * 100
            : thisMonth! > 0
            ? 100
            : 0

        return {
          total: total ?? 0,
          thisMonth: thisMonth ?? 0,
          lastMonth: lastMonth ?? 0,
          percentChange,
        }
      }

      // Jobs
      const jobs = await getCounts("jobs", { school_id: SCHOOL_ID })

      // Applications
      const applications = await getCounts(
        "job_applications",
        { "job_id.school_id": SCHOOL_ID },
      )

      // Interviews
      const interviews = await getCounts(
        "job_applications",
        { "job_id.school_id": SCHOOL_ID },
        "Interview-Scheduled"
      )

      // Offers
      const offers = await getCounts(
        "job_applications",
        { "job_id.school_id": SCHOOL_ID },
        "Offered"
      )

      setStats({ jobs, applications, interviews, offers })
    }

    fetchStats()
  }, [])

  const renderCard = (title: string, stat: Stat) => {
    const isUp = stat.percentChange >= 0
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {stat.total}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {isUp ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
              {stat.percentChange.toFixed(1)}%
            </Badge>
            <div>
              This month: {stat.thisMonth} | Last month: {stat.lastMonth}
            </div>
          </div>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {renderCard("Jobs Posted", stats.jobs)}
      {renderCard("Applications Received", stats.applications)}
      {renderCard("Interviews Scheduled", stats.interviews)}
      {renderCard("Offered Candidates", stats.offers)}
    </div>
  )
}
