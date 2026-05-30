import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

interface DialogContentProps {
  children: ReactNode
  className?: string
  'aria-label'?: string
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>,
    document.body,
  )
}

export function DialogContent({ children, className, 'aria-label': ariaLabel }: DialogContentProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Focus the dialog panel when it mounts
  useEffect(() => {
    ref.current?.focus()
  }, [])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      tabIndex={-1}
      className={cn(
        'relative z-50 w-full max-w-md rounded-xl border border-border bg-card shadow-xl',
        'max-h-[90svh] overflow-y-auto',
        'focus:outline-none',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-5 pt-5 pb-3', className)}>{children}</div>
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('text-base font-semibold text-foreground', className)}>{children}</h2>
}

export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-5 pb-5', className)}>{children}</div>
}
