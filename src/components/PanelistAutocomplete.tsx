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
     Filtering
  ---------------------------- */
  const filtered = useMemo(() => {
    console.log('[PanelistAutocomplete] Filtering with query:', query)
    if (!query) {
      console.log('[PanelistAutocomplete] No query, returning empty array')
      return []
    }

    const q = query.toLowerCase()

    const result = panelists.filter(
      (p) =>
        !selected.some((s) => s.id === p.id) &&
        (`${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q))
    )
    
    console.log('[PanelistAutocomplete] Filtered results:', result.length, result)
    return result
  }, [query, panelists, selected])

  // Debug logging
  useEffect(() => {
    console.log('[PanelistAutocomplete] State:', {
      query,
      open,
      mounted,
      hasPosition: !!position,
      filteredCount: filtered.length,
      selectedCount: selected.length,
      panelistsCount: panelists.length
    })
  }, [query, open, mounted, position, filtered.length, selected.length, panelists.length])

  /* ----------------------------
     Mount guard (portal safe)
  ---------------------------- */
  useEffect(() => {
    console.log('[PanelistAutocomplete] Component mounted')
    setMounted(true)
  }, [])


  /* ----------------------------
     Position calculation
  ---------------------------- */
  useEffect(() => {
    if (!open || !inputRef.current) return

    console.log('[PanelistAutocomplete] Calculating position')
    const rect = inputRef.current.getBoundingClientRect()
    const newPosition = {
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width,
    }
    console.log('[PanelistAutocomplete] Position calculated:', newPosition)
    setPosition(newPosition)
  }, [open, query])

  /* ----------------------------
     Outside click (CAPTURE PHASE for Dialog compatibility)
  ---------------------------- */
  useEffect(() => {
    if (!open) return

    console.log('[PanelistAutocomplete] Setting up outside click listener')

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      console.log('[PanelistAutocomplete] Outside click detected, target:', target)

      // Check if click is inside input
      if (inputRef.current?.contains(target)) {
        console.log('[PanelistAutocomplete] Click inside input, ignoring')
        return
      }

      // Check if click is inside dropdown using data attribute
      const clickedDropdown = target.closest('[data-autocomplete-dropdown]')
      if (clickedDropdown) {
        console.log('[PanelistAutocomplete] Click inside dropdown, ignoring')
        return
      }

      console.log('[PanelistAutocomplete] Click outside, closing dropdown')
      setOpen(false)
    }

    // Use capture phase to handle before Dialog's handlers
    document.addEventListener('mousedown', handler, true)
    return () => {
      console.log('[PanelistAutocomplete] Removing outside click listener')
      document.removeEventListener('mousedown', handler, true)
    }
  }, [open])

  /* ----------------------------
     Selection
  ---------------------------- */
  const selectPanelist = (p: Panelist) => {
    console.log('[PanelistAutocomplete] selectPanelist called with:', p)
    console.log('[PanelistAutocomplete] Current selected before add:', selected)
    
    onAdd(p)
    console.log('[PanelistAutocomplete] onAdd callback completed')
    
    setQuery('')
    console.log('[PanelistAutocomplete] Query cleared')
    
    setOpen(false)
    console.log('[PanelistAutocomplete] Dropdown closed')
  }

  /* ----------------------------
     Render
  ---------------------------- */
  console.log('[PanelistAutocomplete] Rendering, should show dropdown?', 
    mounted && open && filtered.length > 0 && !!position)

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          console.log('[PanelistAutocomplete] Input changed:', e.target.value)
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          console.log('[PanelistAutocomplete] Input focused, query:', query)
          if (query) setOpen(true)
        }}
        placeholder="Add interviewer by name or email"
        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      />

      {mounted &&
        open &&
        filtered.length > 0 &&
        position &&
        (() => {
          console.log('[PanelistAutocomplete] Creating portal with', filtered.length, 'items')
          return createPortal(
            <div
              ref={dropdownRef}
              data-autocomplete-dropdown="true"
              className="fixed bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-auto"
              style={{
                top: position.top,
                left: position.left,
                width: position.width,
                zIndex: 9999999, // Inline style to ensure it's above Dialog
                pointerEvents: 'auto', // Ensure clicks are captured
              }}
              onClick={(e) => {
                console.log('[PanelistAutocomplete] Dropdown container clicked')
                // Prevent Dialog from closing
                e.stopPropagation()
              }}
              onMouseDown={(e) => {
                console.log('[PanelistAutocomplete] Dropdown container mousedown')
                // Prevent Dialog from closing and prevent input blur
                e.stopPropagation()
              }}
            >
            {filtered.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={(e) => {
                  console.log('[PanelistAutocomplete] Button CLICKED for:', p.email)
                  e.preventDefault()
                  e.stopPropagation()
                  selectPanelist(p)
                }}
                onMouseDown={(e) => {
                  console.log('[PanelistAutocomplete] Button MOUSEDOWN for:', p.email)
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onMouseEnter={() => {
                  console.log('[PanelistAutocomplete] Mouse entered button for:', p.email)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 text-left border-0 bg-transparent"
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
              </button>
            ))}
          </div>,
          document.body
        )
      })()}
    </div>
  )
}