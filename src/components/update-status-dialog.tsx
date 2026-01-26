'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  CalendarClock,
  XCircle,
} from 'lucide-react'

type InterviewStatus = 'completed' | 'rescheduled' | 'cancelled'

interface UpdateStatusDialogProps {
  isOpen: boolean
  onClose: () => void
  onStatusUpdate: (status: InterviewStatus) => void
}

const STATUS_OPTIONS = [
  {
    value: 'completed' as const,
    title: 'Mark as completed',
    description: 'Interview concluded successfully.',
    Icon: CheckCircle2,
    tone: 'success',
  },
  {
    value: 'rescheduled' as const,
    title: 'Reschedule interview',
    description: 'Change date or time and notify participants.',
    Icon: CalendarClock,
    tone: 'info',
  },
  {
    value: 'cancelled' as const,
    title: 'Cancel interview',
    description: 'Interview will not proceed.',
    Icon: XCircle,
    tone: 'destructive',
  },
]

export default function UpdateStatusDialog({
  isOpen,
  onClose,
  onStatusUpdate,
}: UpdateStatusDialogProps) {
  const [value, setValue] = React.useState<InterviewStatus | null>(null)

  const confirm = () => {
    if (!value) return
    onStatusUpdate(value)
    setValue(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0">
        {/* Header — no divider */}
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="text-lg font-semibold">
            Update interview status
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose how this interview should be recorded.
          </p>
        </DialogHeader>

        {/* Body — single visual separation via background */}
        <div className="px-6 py-4 space-y-2">
          {STATUS_OPTIONS.map(({ value: v, title, description, Icon, tone }) => {
            const selected = value === v

            return (
              <button
                key={v}
                type="button"
                onClick={() => setValue(v)}
                className={cn(
                  'w-full rounded-lg border bg-background px-4 py-4 text-left transition',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border hover:bg-muted'
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-md',
                      tone === 'success' && 'bg-emerald-50 text-emerald-600',
                      tone === 'info' && 'bg-blue-50 text-blue-600',
                      tone === 'destructive' && 'bg-red-50 text-red-600'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <div className="font-medium">{title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {description}
                    </div>
                  </div>

                  <div
                    className={cn(
                      'mt-1 h-4 w-4 rounded-full border',
                      selected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    )}
                  />
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer — spacing only, no border */}
        <DialogFooter className="px-6 pb-6 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={!value}>
            Confirm update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
