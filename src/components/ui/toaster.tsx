import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore, type ToastItem } from '@/store/toastStore'
import { cn } from '@/lib/utils'

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const STYLES: Record<ToastItem['type'], string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300',
  warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300',
}

function Toast({ item }: { item: ToastItem }) {
  const remove = useToastStore((s) => s.remove)
  const Icon = ICONS[item.type]

  useEffect(() => {
    const timer = setTimeout(() => remove(item.id), item.duration)
    return () => clearTimeout(timer)
  }, [item.id, item.duration, remove])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-2.5 rounded-lg border px-3.5 py-3 shadow-md text-sm font-medium',
        'animate-in slide-in-from-bottom-4 fade-in duration-200',
        STYLES[item.type],
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">{item.message}</span>
      <button
        onClick={() => remove(item.id)}
        aria-label="Dismiss notification"
        className="ml-1 rounded opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-1"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  if (toasts.length === 0) return null

  return createPortal(
    <div
      aria-label="Notifications"
      className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 sm:bottom-4 max-w-sm w-full px-4 sm:px-0"
    >
      {toasts.map((t) => (
        <Toast key={t.id} item={t} />
      ))}
    </div>,
    document.body,
  )
}
