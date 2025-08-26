"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase/api/client"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

type Job = {
  id: string
  title: string
  grade_levels: string[] | null
  subjects: string[] | null
  status: string
  applications: number
}

const columns: ColumnDef<Job>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => row.original.title,
  },
  {
    accessorKey: "grade_levels",
    header: "Grades",
    cell: ({ row }) =>
      row.original.grade_levels?.length ? (
        <div className="flex gap-1 flex-wrap">
          {row.original.grade_levels.map((g) => (
            <Badge key={g} variant="outline">{g}</Badge>
          ))}
        </div>
      ) : (
        "-"
      ),
  },
  {
    accessorKey: "subjects",
    header: "Subjects",
    cell: ({ row }) =>
      row.original.subjects?.length ? (
        <div className="flex gap-1 flex-wrap">
          {row.original.subjects.map((s) => (
            <Badge key={s} variant="secondary">{s}</Badge>
          ))}
        </div>
      ) : (
        "-"
      ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5">
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "applications",
    header: "Applications",
    cell: ({ row }) => row.original.applications,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    ),
  },
]

export function JobsTable() {
  const [data, setData] = React.useState<Job[]>([])

  React.useEffect(() => {
    async function fetchJobs() {
      // Fetch jobs for school, now with subjects
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("id, title, grade_levels, subjects, status")
        .eq("school_id", "2317e986-3ebe-415e-b402-849d80f714a0")

      if (error) {
        console.error(error)
        return
      }

      if (!jobs) return

      // Fetch application counts
      const { data: applications, error: appError } = await supabase
        .from("job_applications")
        .select("job_id")

      if (appError) {
        console.error(appError)
        return
      }

      // Count apps per job
      const appCountMap: Record<string, number> = {}
      applications?.forEach((a: any) => {
        appCountMap[a.job_id] = (appCountMap[a.job_id] || 0) + 1
      })

      const jobsWithCount: Job[] = jobs.map((job: any) => ({
        ...job,
        applications: appCountMap[job.id] || 0,
      }))

      setData(jobsWithCount)
    }

    fetchJobs()
  }, [])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-hidden rounded-lg border mx-2">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No jobs found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
