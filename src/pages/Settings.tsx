import { useNavigate } from 'react-router-dom'
import { LogOut, Download, Bell, User } from 'lucide-react'
import { signOut } from '@/services/auth'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useTransactions } from '@/hooks/useTransactions'
import { useToast } from '@/store/toastStore'
import { exportTransactionsToCSV } from '@/utils/exportCSV'
import { requestNotificationPermission, initializeFCM } from '@/services/notifications'
import { ROUTES } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const activeMonth = useUIStore((s) => s.activeMonth)
  const { toast } = useToast()
  const userId = currentUser?.uid ?? ''

  const { data: transactions = [] } = useTransactions(userId, activeMonth)

  const handleSignOut = async (): Promise<void> => {
    await signOut()
    navigate(ROUTES.AUTH, { replace: true })
  }

  const handleExport = (): void => {
    if (transactions.length === 0) {
      toast.warning('No transactions to export for this month')
      return
    }
    exportTransactionsToCSV(transactions)
    toast.success(`Exported ${transactions.length} transactions`)
  }

  const handleNotifications = async (): Promise<void> => {
    const permission = await requestNotificationPermission()
    if (permission === 'granted') {
      if (currentUser) {
        await initializeFCM(currentUser.uid)
        toast.success('Push notifications enabled')
      }
    } else {
      toast.warning('Notification permission denied')
    }
  }

  return (
    <div className="px-4 py-5 lg:px-6 max-w-lg space-y-4">
      <h1 className="text-lg font-bold text-foreground">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
              {currentUser?.displayName?.slice(0, 2).toUpperCase() ?? <User className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{currentUser?.displayName ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{currentUser?.email ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground">Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleExport}
            aria-label="Export transactions as CSV"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export Transactions (CSV)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleNotifications}
            aria-label="Enable push notifications"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            Enable Push Notifications
          </Button>
        </CardContent>
      </Card>

      {/* Sign out */}
      <Card>
        <CardContent className="pt-4">
          <Button
            variant="destructive"
            className="w-full justify-start gap-2"
            onClick={handleSignOut}
            aria-label="Sign out of FinTrack"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">FinTrack v1.0 · Currency: INR (₹)</p>
    </div>
  )
}

