import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { drainPendingQueue } from '@/services/sync'

/**
 * Listens for the browser `online` event and drains the IndexedDB pending-sync
 * queue whenever the user's device reconnects to the internet.
 *
 * Mount this once at the app root (inside App.tsx).
 */
export function useNetworkSync(): void {
  const currentUser = useAuthStore((s) => s.currentUser)

  useEffect(() => {
    if (!currentUser) return

    const { uid } = currentUser

    const handleOnline = (): void => {
      drainPendingQueue(uid).catch((err: unknown) => {
        console.error('[FinTrack Sync] drainPendingQueue failed:', err)
      })
    }

    // Attempt an immediate drain in case we were offline during the last session
    if (navigator.onLine) {
      handleOnline()
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [currentUser])
}
