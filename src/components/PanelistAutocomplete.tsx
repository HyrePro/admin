'use client'

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

type Panelist = {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  avatar?: string | null
}

type Props = {
  panelists: Panelist[]
  selected: Panelist[]
  onAdd: (p: Panelist) => void
}

export default function PanelistAutocomplete({
  panelists,
  selected,
  onAdd,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)

  /* ----------------------------
     Mount guard (portal safety)
  ---------------------------- */
  useEffect(() => {
    setMounted(true)
  }, [])

  /* ----------------------------
     Filtering
  ---------------------------- */
  const filtered = useMemo(() => {
    if (!query) return []
    const q = query.toLowerCase()

    return panelists.filter(
      (p) =>
        !selected.some((s) => s.id === p.id) &&
        (`${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q))
    )
  }, [query, panelists, selected])

  /* ----------------------------
     Position calculation
  ---------------------------- */
  useEffect(() => {
    if (!open || !inputRef.current) return

    const rect = inputRef.current.getBoundingClientRect()
    setPosition({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width,
    })
  }, [open, query])

  /* ----------------------------
     Outside click (portal-safe)
  ---------------------------- */
  useEffect(() => {
    if (!open) return

    const handler = (e: MouseEvent) => {
      const target = e.target as Node

      if (
        inputRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return
      }

      setOpen(false)
    }

    document.addEventListener('mousedown', handler, true)
    return () => document.removeEventListener('mousedown', handler, true)
  }, [open])

  /* ----------------------------
     Selection
  ---------------------------- */
  const selectPanelist = (p: Panelist) => {
    onAdd(p)
    setQuery('')
    setOpen(false)
  }

  /* ----------------------------
     Render
  ---------------------------- */
  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => query && setOpen(true)}
        placeholder="Add interviewer by name or email"
        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      />

      {mounted &&
        open &&
        filtered.length > 0 &&
        position &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[99999] bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-auto"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
            }}
          >
            {filtered.map((p) => (
              <div
                key={p.id}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  selectPanelist(p)
                }}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50"
              >
                {p.avatar ? (
                  <img
                    src={p.avatar}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-medium">
                    {(p.first_name[0] || '') + (p.last_name[0] || '')}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-800 truncate">
                    {p.first_name} {p.last_name}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {p.email}
                  </div>
                  <div className="text-[11px] text-slate-400 capitalize">
                    {p.role}
                  </div>
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  )
}
