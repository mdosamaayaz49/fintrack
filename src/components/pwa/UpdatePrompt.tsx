import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      // Poll for updates every hour
      if (r) setInterval(() => r.update(), 60 * 60 * 1000)
    },
  })

  if (!needRefresh) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-20 inset-x-4 z-40 flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-lg sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-sm"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Update available</p>
        <p className="text-xs text-muted-foreground">A new version of FinTrack is ready</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button size="sm" onClick={() => updateServiceWorker(true)} aria-label="Reload to update app">
          <RefreshCw className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Update
        </Button>
        <button
          onClick={() => setNeedRefresh(false)}
          aria-label="Dismiss update prompt"
          className="rounded p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
