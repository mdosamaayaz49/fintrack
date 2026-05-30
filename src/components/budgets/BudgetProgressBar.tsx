import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/utils/formatCurrency'
import { CATEGORY_LABELS, CATEGORY_COLORS, type Budget } from '@/types'
import { cn } from '@/lib/utils'

interface BudgetProgressBarProps {
  budget: Budget
  spent: number
}

export function BudgetProgressBar({ budget, spent }: BudgetProgressBarProps) {
  const percent = (spent / budget.limit) * 100
  const isAlert = percent >= 90
  const isOver = percent >= 100

  return (
    <div aria-label={`${CATEGORY_LABELS[budget.category]} budget progress`}>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: CATEGORY_COLORS[budget.category] }}
            aria-hidden="true"
          />
          <span className="font-medium text-foreground">{CATEGORY_LABELS[budget.category]}</span>
          {isAlert && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                isOver
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
              )}
            >
              {isOver ? 'Over budget' : '90%+'}
            </span>
          )}
        </div>
        <span className="text-muted-foreground">
          <span className={cn(isAlert && 'font-semibold', isOver ? 'text-destructive' : isAlert ? 'text-amber-600' : '')}>
            {formatCurrency(spent)}
          </span>
          {' / '}
          {formatCurrency(budget.limit)}
        </span>
      </div>
      <Progress
        value={spent}
        max={budget.limit}
        aria-label={`${CATEGORY_LABELS[budget.category]}: ₹${spent} of ₹${budget.limit}`}
      />
    </div>
  )
}
