import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { cn } from '@/lib/utils'

type BannerState = 'online' | 'offline' | 'hidden'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  const [state, setState] = useState<BannerState>('hidden')

  useEffect(() => {
    if (!isOnline) {
      setState('offline')
      return
    }
    // Was offline → briefly flash "back online"
    if (state === 'offline') {
      setState('online')
      const t = setTimeout(() => setState('hidden'), 3000)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline])

  if (state === 'hidden') return null

  const isOffline = state === 'offline'

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 py-2 text-sm font-medium',
        'transition-transform duration-300',
        isOffline
          ? 'bg-amber-500 text-amber-950'
          : 'bg-emerald-500 text-emerald-950',
      )}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          You are offline — changes will sync when you reconnect
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4" aria-hidden="true" />
          Back online — syncing changes…
        </>
      )}
    </div>
  )
}
