import { useMemo } from 'react'
import { useTransactions } from './useTransactions'
import type { MonthlyStats, Transaction } from '@/types'

/** Computes MonthlyStats from the transactions in the TanStack Query cache.
 *  No extra network call — derives directly from the transactions query. */
export function useMonthlyStats(userId: string, month: string): {
  stats: MonthlyStats
  isLoading: boolean
} {
  const { data: transactions = [], isLoading } = useTransactions(userId, month)

  const stats = useMemo((): MonthlyStats => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const byCategory = transactions
      .filter((t): t is Transaction & { type: 'expense' } => t.type === 'expense')
      .reduce(
        (acc, t) => {
          acc[t.category] = (acc[t.category] ?? 0) + t.amount
          return acc
        },
        {} as MonthlyStats['byCategory'],
      )

    return {
      month,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      byCategory,
      updatedAt: Date.now(),
    }
  }, [transactions, month])

  return { stats, isLoading }
}
