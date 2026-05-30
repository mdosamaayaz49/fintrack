import { Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { BudgetProgressBar } from './BudgetProgressBar'
import type { Budget, Transaction } from '@/types'

interface BudgetCardProps {
  budget: Budget
  transactions: Transaction[]
  onEdit: (budget: Budget) => void
  onDelete: (id: string) => void
}

export function BudgetCard({ budget, transactions, onEdit, onDelete }: BudgetCardProps) {
  const spent = transactions
    .filter((t) => t.type === 'expense' && t.category === budget.category)
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <BudgetProgressBar budget={budget} spent={spent} />
          </div>
          <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
            <button
              onClick={() => onEdit(budget)}
              aria-label={`Edit budget for ${budget.category}`}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(budget.id)}
              aria-label={`Delete budget for ${budget.category}`}
              className="rounded p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
