import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useTransactions, useAddTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions'
import { useToast } from '@/store/toastStore'
import { TransactionList } from '@/components/transactions/TransactionList'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { Button } from '@/components/ui/button'
import type { Transaction } from '@/types'

type NewTransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'synced' | 'schemaVersion' | 'userId'>

export default function TransactionsPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const activeMonth = useUIStore((s) => s.activeMonth)
  const userId = currentUser?.uid ?? ''
  const { toast } = useToast()

  const [formOpen, setFormOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | undefined>()

  const { data: transactions = [], isLoading } = useTransactions(userId, activeMonth)
  const addMutation = useAddTransaction(userId, activeMonth)
  const updateMutation = useUpdateTransaction(userId, activeMonth)
  const deleteMutation = useDeleteTransaction(userId, activeMonth)

  const handleAdd = async (input: NewTransactionInput): Promise<void> => {
    await addMutation.mutateAsync(input)
    toast.success('Transaction added')
  }

  const handleUpdate = async (input: NewTransactionInput): Promise<void> => {
    if (!editingTx) return
    await updateMutation.mutateAsync({ id: editingTx.id, updates: input })
    toast.success('Transaction updated')
  }

  const handleDelete = (id: string): void => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Transaction deleted'),
      onError: () => toast.error('Failed to delete transaction'),
    })
  }

  const handleEdit = (tx: Transaction): void => {
    setEditingTx(tx)
    setFormOpen(true)
  }

  const handleFormClose = (open: boolean): void => {
    setFormOpen(open)
    if (!open) setEditingTx(undefined)
  }

  return (
    <div className="px-4 py-5 lg:px-6 max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Transactions</h1>
        <Button
          onClick={() => { setEditingTx(undefined); setFormOpen(true) }}
          aria-label="Add new transaction"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
          Add
        </Button>
      </div>

      <TransactionList
        transactions={transactions}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TransactionForm
        open={formOpen}
        onOpenChange={handleFormClose}
        transaction={editingTx}
        onSubmit={editingTx ? handleUpdate : handleAdd}
      />
    </div>
  )
}

