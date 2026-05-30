import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { TransactionCard } from '@/components/transactions/TransactionCard'
import { TransactionSkeleton } from '@/components/ui/skeleton'
import { ROUTES, type Transaction } from '@/types'

interface RecentTransactionsProps {
  transactions: Transaction[]
  isLoading: boolean
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  const recent = transactions.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">Recent Transactions</CardTitle>
          <Link
            to={ROUTES.TRANSACTIONS}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
            aria-label="View all transactions"
          >
            View all
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <>
            {[0, 1, 2].map((i) => <TransactionSkeleton key={i} />)}
          </>
        ) : recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No transactions this month
          </p>
        ) : (
          recent.map((t) => (
            <TransactionCard key={t.id} transaction={t} compact />
          ))
        )}
      </CardContent>
    </Card>
  )
}
