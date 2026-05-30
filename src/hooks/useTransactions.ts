import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTransactionsByMonth,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/services/transactions'
import { queryKeys, type Transaction } from '@/types'

type NewTransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'synced' | 'schemaVersion' | 'userId'>

export function useTransactions(userId: string, month: string) {
  return useQuery({
    queryKey: queryKeys.transactions(userId, month),
    queryFn: () => getTransactionsByMonth(userId, month),
    enabled: !!userId && !!month,
  })
}

export function useAddTransaction(userId: string, month: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewTransactionInput) => addTransaction(userId, input),
    onSuccess: (transaction) => {
      // Directly update cache — no re-fetch required, works offline too
      queryClient.setQueryData<Transaction[]>(
        queryKeys.transactions(userId, month),
        (old = []) => [transaction, ...old],
      )
    },
  })
}

export function useUpdateTransaction(userId: string, month: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'schemaVersion'>>
    }) => updateTransaction(userId, id, updates),
    onSuccess: (_, { id, updates }) => {
      queryClient.setQueryData<Transaction[]>(
        queryKeys.transactions(userId, month),
        (old = []) => old.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      )
    },
  })
}

export function useDeleteTransaction(userId: string, month: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(userId, id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Transaction[]>(
        queryKeys.transactions(userId, month),
        (old = []) => old.filter((t) => t.id !== id),
      )
    },
  })
}
