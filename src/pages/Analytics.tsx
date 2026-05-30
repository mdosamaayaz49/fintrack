import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useTransactions } from '@/hooks/useTransactions'
import { useMonthlyStats } from '@/hooks/useMonthlyStats'
import { SpendingPieChart } from '@/components/charts/SpendingPieChart'
import { MonthlyBarChart } from '@/components/charts/MonthlyBarChart'
import { DailyLineChart } from '@/components/charts/DailyLineChart'
import { formatMonth } from '@/utils/formatDate'

export default function AnalyticsPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const activeMonth = useUIStore((s) => s.activeMonth)
  const userId = currentUser?.uid ?? ''

  const { data: transactions = [], isLoading } = useTransactions(userId, activeMonth)
  const { stats, isLoading: statsLoading } = useMonthlyStats(userId, activeMonth)

  return (
    <div className="px-4 py-5 lg:px-6 space-y-5 max-w-5xl">
      <div>
        <h1 className="text-lg font-bold text-foreground">Analytics</h1>
        <p className="text-xs text-muted-foreground">{formatMonth(activeMonth)}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SpendingPieChart stats={stats} isLoading={statsLoading} />
        <MonthlyBarChart userId={userId} currentMonth={activeMonth} />
      </div>
      <DailyLineChart transactions={transactions} month={activeMonth} isLoading={isLoading} />
    </div>
  )
}

