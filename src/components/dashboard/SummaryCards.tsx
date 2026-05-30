import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card'
import { CardSkeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatCurrencyCompact } from '@/utils/formatCurrency'
import type { MonthlyStats } from '@/types'

interface SummaryCardsProps {
  stats: MonthlyStats
  isLoading: boolean
}

interface StatCardProps {
  title: string
  amount: number
  icon: typeof TrendingUp
  iconClass: string
  amountClass: string
  subtitle?: string
}

function StatCard({ title, amount, icon: Icon, iconClass, amountClass, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p
          className={`text-2xl font-bold tracking-tight ${amountClass}`}
          aria-label={`${title}: ${formatCurrency(amount)}`}
          title={formatCurrency(amount)}
        >
          {formatCurrencyCompact(amount)}
        </p>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

export function SummaryCards({ stats, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
      </div>
    )
  }

  const savingsRate =
    stats.totalIncome > 0
      ? Math.round(((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100)
      : 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" role="region" aria-label="Monthly summary">
      <StatCard
        title="Total Income"
        amount={stats.totalIncome}
        icon={TrendingUp}
        iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        amountClass="text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        title="Total Expense"
        amount={stats.totalExpense}
        icon={TrendingDown}
        iconClass="bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400"
        amountClass="text-red-500 dark:text-red-400"
      />
      <StatCard
        title="Balance"
        amount={stats.balance}
        icon={Wallet}
        iconClass={
          stats.balance >= 0
            ? 'bg-primary/10 text-primary'
            : 'bg-destructive/10 text-destructive'
        }
        amountClass={stats.balance >= 0 ? 'text-foreground' : 'text-destructive'}
        subtitle={stats.totalIncome > 0 ? `${savingsRate}% savings rate` : undefined}
      />
    </div>
  )
}
