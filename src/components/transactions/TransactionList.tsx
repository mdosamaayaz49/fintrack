import { TransactionCard } from './TransactionCard'
import { TransactionSkeleton } from '@/components/ui/skeleton'
import type { Transaction } from '@/types'

interface TransactionListProps {
  transactions: Transaction[]
  isLoading: boolean
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

export function TransactionList({ transactions, isLoading, onEdit, onDelete }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading transactions">
        {[0, 1, 2, 3, 4].map((i) => <TransactionSkeleton key={i} />)}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">No transactions this month</p>
        <p className="mt-1 text-xs text-muted-foreground">Tap + to add your first one</p>
      </div>
    )
  }

  // Group transactions by date
  const byDate = transactions.reduce<Record<string, Transaction[]>>((acc, t) => {
    if (!acc[t.date]) acc[t.date] = []
    acc[t.date].push(t)
    return acc
  }, {})

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-4" role="list" aria-label="Transaction list">
      {sortedDates.map((date) => (
        <div key={date} role="group" aria-label={date}>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </p>
          <div className="space-y-1.5">
            {byDate[date].map((t) => (
              <TransactionCard key={t.id} transaction={t} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
