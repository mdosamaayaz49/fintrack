import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useTransactions } from '@/hooks/useTransactions'
import { useBudgets } from '@/hooks/useBudgets'
import { useMonthlyStats } from '@/hooks/useMonthlyStats'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { BudgetProgress } from '@/components/dashboard/BudgetProgress'
import { SpendingPieChart } from '@/components/charts/SpendingPieChart'

export default function DashboardPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const activeMonth = useUIStore((s) => s.activeMonth)
  const userId = currentUser?.uid ?? ''

  const { data: transactions = [], isLoading: txLoading } = useTransactions(userId, activeMonth)
  const { data: budgets = [], isLoading: budgetLoading } = useBudgets(userId, activeMonth)
  const { stats, isLoading: statsLoading } = useMonthlyStats(userId, activeMonth)

  return (
    <div className="px-4 py-5 lg:px-6 space-y-5 max-w-5xl">
      <SummaryCards stats={stats} isLoading={statsLoading} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RecentTransactions transactions={transactions} isLoading={txLoading} />
        <div className="space-y-5">
          <SpendingPieChart stats={stats} isLoading={statsLoading} />
          <BudgetProgress budgets={budgets} transactions={transactions} isLoading={budgetLoading} />
        </div>
      </div>
    </div>
  )
}

