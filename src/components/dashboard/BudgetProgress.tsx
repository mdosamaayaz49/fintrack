import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/utils/formatCurrency'
import { CATEGORY_LABELS, CATEGORY_COLORS, ROUTES, type Budget, type Transaction } from '@/types'

interface BudgetProgressProps {
  budgets: Budget[]
  transactions: Transaction[]
  isLoading: boolean
}

export function BudgetProgress({ budgets, transactions, isLoading }: BudgetProgressProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground">Budget Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-24" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (budgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground">Budget Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-sm text-muted-foreground">
            No budgets set.{' '}
            <Link to={ROUTES.BUDGETS} className="text-primary hover:underline">
              Add budgets →
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  const expensesByCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount
      return acc
    }, {})

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">Budget Progress</CardTitle>
          <Link
            to={ROUTES.BUDGETS}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
            aria-label="Manage budgets"
          >
            Manage
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.map((budget) => {
          const spent = expensesByCategory[budget.category] ?? 0
          const percent = (spent / budget.limit) * 100
          const isAlert = percent >= 90

          return (
            <div key={budget.id} aria-label={`${CATEGORY_LABELS[budget.category]} budget`}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[budget.category] }}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-foreground">
                    {CATEGORY_LABELS[budget.category]}
                  </span>
                  {isAlert && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Alert
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground">
                  <span className={isAlert ? 'font-semibold text-amber-600' : ''}>{formatCurrency(spent)}</span>
                  {' / '}
                  {formatCurrency(budget.limit)}
                </span>
              </div>
              <Progress
                value={spent}
                max={budget.limit}
                aria-label={`${CATEGORY_LABELS[budget.category]}: ${formatCurrency(spent)} of ${formatCurrency(budget.limit)}`}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
