'use client'
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

export function Dialog({ open, onOpenChange, children }: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  children: React.ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white dark:bg-black p-6 shadow-lg focus:outline-none">
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function DialogTitle({ children, className = "", ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>
      {children}
    </DialogPrimitive.Title>
  )
}

export function DialogDescription({ children, className = "", ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={`text-sm text-muted-foreground ${className}`} {...props}>
      {children}
    </DialogPrimitive.Description>
  )
}

Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription; 