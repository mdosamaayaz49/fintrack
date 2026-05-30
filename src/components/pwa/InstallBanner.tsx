import { useState } from 'react'
import { Download, X, IndianRupee } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { Button } from '@/components/ui/button'

export function InstallBanner() {
  const { canInstall, install } = usePWAInstall()
  const [dismissed, setDismissed] = useState(false)

  if (!canInstall || dismissed) return null

  return (
    <div
      role="banner"
      aria-label="Install FinTrack app"
      className="fixed bottom-20 inset-x-4 z-40 flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-lg sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-sm"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shrink-0">
        <IndianRupee className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Install FinTrack</p>
        <p className="text-xs text-muted-foreground">Add to home screen for offline access</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button size="sm" onClick={install} aria-label="Install app">
          <Download className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Install
        </Button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss install banner"
          className="rounded p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
