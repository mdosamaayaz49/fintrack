import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useBudgets, useAddBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudgets'
import { useTransactions } from '@/hooks/useTransactions'
import { useToast } from '@/store/toastStore'
import { BudgetCard } from '@/components/budgets/BudgetCard'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { Button } from '@/components/ui/button'
import { CardSkeleton } from '@/components/ui/skeleton'
import { formatMonth } from '@/utils/formatDate'
import type { Budget } from '@/types'

type NewBudgetInput = Omit<Budget, 'id' | 'userId'>

export default function BudgetsPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const activeMonth = useUIStore((s) => s.activeMonth)
  const userId = currentUser?.uid ?? ''
  const { toast } = useToast()

  const [formOpen, setFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>()

  const { data: budgets = [], isLoading: budgetLoading } = useBudgets(userId, activeMonth)
  const { data: transactions = [] } = useTransactions(userId, activeMonth)
  const addMutation = useAddBudget(userId, activeMonth)
  const updateMutation = useUpdateBudget(userId, activeMonth)
  const deleteMutation = useDeleteBudget(userId, activeMonth)

  const handleAdd = async (input: NewBudgetInput): Promise<void> => {
    await addMutation.mutateAsync(input)
    toast.success('Budget set')
  }

  const handleUpdate = async (input: NewBudgetInput): Promise<void> => {
    if (!editingBudget) return
    await updateMutation.mutateAsync({ id: editingBudget.id, updates: { limit: input.limit } })
    toast.success('Budget updated')
  }

  const handleDelete = (id: string): void => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Budget removed'),
      onError: () => toast.error('Failed to delete budget'),
    })
  }

  const handleEdit = (b: Budget): void => {
    setEditingBudget(b)
    setFormOpen(true)
  }

  const handleFormClose = (open: boolean): void => {
    setFormOpen(open)
    if (!open) setEditingBudget(undefined)
  }

  return (
    <div className="px-4 py-5 lg:px-6 max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Budgets</h1>
          <p className="text-xs text-muted-foreground">{formatMonth(activeMonth)}</p>
        </div>
        <Button onClick={() => { setEditingBudget(undefined); setFormOpen(true) }} size="sm" aria-label="Set new budget">
          <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
          Set Budget
        </Button>
      </div>

      {budgetLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">No budgets for this month</p>
          <p className="mt-1 text-xs text-muted-foreground">Set spending limits to track your expenses</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              transactions={transactions}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <BudgetForm
        open={formOpen}
        onOpenChange={handleFormClose}
        budget={editingBudget}
        month={activeMonth}
        onSubmit={editingBudget ? handleUpdate : handleAdd}
      />
    </div>
  )
}

