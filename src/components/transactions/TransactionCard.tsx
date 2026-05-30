import { type MouseEventHandler } from 'react'
import { Pencil, Trash2, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'
import { CATEGORY_LABELS, CATEGORY_COLORS, type Transaction } from '@/types'
import { cn } from '@/lib/utils'

interface TransactionCardProps {
  transaction: Transaction
  compact?: boolean
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string) => void
}

export function TransactionCard({ transaction, compact = false, onEdit, onDelete }: TransactionCardProps) {
  const { type, amount, category, description, date, synced } = transaction

  const handleEdit: MouseEventHandler = (e) => {
    e.stopPropagation()
    onEdit?.(transaction)
  }
  const handleDelete: MouseEventHandler = (e) => {
    e.stopPropagation()
    onDelete?.(transaction.id)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-card transition-colors hover:bg-muted/40',
        compact ? 'p-2.5' : 'p-3',
      )}
    >
      {/* Category colour dot */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
        style={{ backgroundColor: CATEGORY_COLORS[category] }}
        aria-hidden="true"
      >
        {CATEGORY_LABELS[category].slice(0, 2).toUpperCase()}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-foreground">
            {description || CATEGORY_LABELS[category]}
          </p>
          {!synced && (
            <WifiOff className="h-3 w-3 shrink-0 text-amber-500" aria-label="Pending sync" />
          )}
        </div>
        {!compact && (
          <div className="mt-0.5 flex items-center gap-1.5">
            <Badge variant="category" category={category}>
              {CATEGORY_LABELS[category]}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
          </div>
        )}
        {compact && (
          <p className="text-xs text-muted-foreground">{formatDate(date)}</p>
        )}
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
          )}
          aria-label={`${type === 'income' ? '+' : '-'}${formatCurrency(amount)}`}
        >
          {type === 'income' ? '+' : '-'}{formatCurrency(amount)}
        </span>
        {!compact && (onEdit ?? onDelete) && (
          <div className="flex items-center gap-0.5">
            {onEdit && (
              <button
                onClick={handleEdit}
                aria-label={`Edit transaction: ${description}`}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                aria-label={`Delete transaction: ${description}`}
                className="rounded p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
