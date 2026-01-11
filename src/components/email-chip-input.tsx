'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

type EmailChipInputProps = {
  value: string[]
  onChange: (emails: string[]) => void
  placeholder?: string
  disabled?: boolean
}

export function EmailChipInput({
  value,
  onChange,
  placeholder = 'Enter email addresses',
  disabled,
}: EmailChipInputProps) {
  const [input, setInput] = React.useState('')

  const addEmails = (raw: string) => {
    if (!raw) return

    const tokens = raw
      .split(/[\s,]+/)
      .map(t => t.trim())
      .filter(Boolean)

    if (!tokens.length) return

    const valid = tokens.filter(
      t => EMAIL_REGEX.test(t) && !value.includes(t)
    )

    if (valid.length) {
      onChange([...value, ...valid])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault()
      addEmails(input)
      setInput('')
    }

    if (e.key === 'Backspace' && !input && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  const handleBlur = () => {
    addEmails(input)
    setInput('')
  }

  return (
    <div
      className={cn(
        'flex min-h-[44px] flex-wrap items-center gap-2 rounded-md border px-2 py-1',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      {value.map(email => (
        <span
          key={email}
          className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-sm"
        >
          {email}
          <button
            type="button"
            onClick={() =>
              onChange(value.filter(e => e !== email))
            }
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="flex-1 min-w-[160px] border-0 bg-transparent p-1 text-sm outline-none"
      />
    </div>
  )
}
