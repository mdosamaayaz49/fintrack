import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBudgetsByMonth,
  addBudget,
  updateBudget,
  deleteBudget,
} from '@/services/budgets'
import { queryKeys, type Budget } from '@/types'

type NewBudgetInput = Omit<Budget, 'id' | 'userId'>

export function useBudgets(userId: string, month: string) {
  return useQuery({
    queryKey: queryKeys.budgets(userId, month),
    queryFn: () => getBudgetsByMonth(userId, month),
    enabled: !!userId && !!month,
  })
}

export function useAddBudget(userId: string, month: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewBudgetInput) => addBudget(userId, input),
    onSuccess: (budget) => {
      queryClient.setQueryData<Budget[]>(
        queryKeys.budgets(userId, month),
        (old = []) => [...old, budget],
      )
    },
  })
}

export function useUpdateBudget(userId: string, month: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<Budget, 'id' | 'userId'>>
    }) => updateBudget(userId, id, updates),
    onSuccess: (_, { id, updates }) => {
      queryClient.setQueryData<Budget[]>(
        queryKeys.budgets(userId, month),
        (old = []) => old.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      )
    },
  })
}

export function useDeleteBudget(userId: string, month: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBudget(userId, id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Budget[]>(
        queryKeys.budgets(userId, month),
        (old = []) => old.filter((b) => b.id !== id),
      )
    },
  })
}
