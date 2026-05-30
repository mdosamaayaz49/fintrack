import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CATEGORIES, CATEGORY_LABELS, type Transaction } from '@/types'
import { todayISO } from '@/utils/formatDate'

// ── Zod schema ───────────────────────────────────────────────────────────────

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount greater than 0'),
  category: z.enum(CATEGORIES),
  description: z.string().max(120, 'Description too long').default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  tags: z.string().default(''),
})

type FormData = z.infer<typeof transactionSchema>

// ── Props ─────────────────────────────────────────────────────────────────────

type NewTransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'synced' | 'schemaVersion' | 'userId'>

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Defined = edit mode; undefined = create mode */
  transaction?: Transaction
  onSubmit: (data: NewTransactionInput) => Promise<void>
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p role="alert" className="mt-1 text-xs text-destructive">{message}</p>
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TransactionForm({ open, onOpenChange, transaction, onSubmit }: TransactionFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const isEdit = !!transaction

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(transactionSchema) as Resolver<FormData>,
    defaultValues: {
      type: transaction?.type ?? 'expense',
      amount: transaction ? String(transaction.amount) : '',
      category: transaction?.category ?? 'food',
      description: transaction?.description ?? '',
      date: transaction?.date ?? todayISO(),
      tags: transaction?.tags.join(', ') ?? '',
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const type = watch('type')

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      setServerError(null)
      onOpenChange(false)
    }
  }

  const onFormSubmit = async (data: FormData): Promise<void> => {
    setServerError(null)
    try {
      await onSubmit({
        type: data.type,
        amount: Number(data.amount),
        category: data.category,
        description: data.description ?? '',
        date: data.date,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      })
      handleClose()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent aria-label={isEdit ? 'Edit transaction' : 'Add transaction'}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="space-y-4">
            {/* Type toggle */}
            <div>
              <Label>Type</Label>
              <div
                role="radiogroup"
                aria-label="Transaction type"
                className="mt-1.5 flex rounded-lg border border-border bg-muted p-1"
              >
                {(['expense', 'income'] as const).map((t) => (
                  <label
                    key={t}
                    className={`flex-1 cursor-pointer rounded-md py-1.5 text-center text-sm font-medium transition-colors ${
                      type === t
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <input type="radio" value={t} {...register('type')} className="sr-only" />
                    {t === 'expense' ? 'Expense' : 'Income'}
                  </label>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="tx-amount">Amount (₹)</Label>
              <Input
                id="tx-amount"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                aria-invalid={!!errors.amount}
                {...register('amount')}
                className="mt-1"
              />
              <FieldError message={errors.amount?.message} />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="tx-category">Category</Label>
              <Select
                id="tx-category"
                aria-invalid={!!errors.category}
                {...register('category')}
                className="mt-1"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </Select>
              <FieldError message={errors.category?.message} />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="tx-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="tx-desc"
                type="text"
                placeholder="e.g. Dinner at restaurant"
                aria-invalid={!!errors.description}
                {...register('description')}
                className="mt-1"
              />
              <FieldError message={errors.description?.message} />
            </div>

            {/* Date */}
            <div>
              <Label htmlFor="tx-date">Date</Label>
              <Input
                id="tx-date"
                type="date"
                aria-invalid={!!errors.date}
                {...register('date')}
                className="mt-1"
              />
              <FieldError message={errors.date?.message} />
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tx-tags">Tags <span className="text-muted-foreground">(comma separated, optional)</span></Label>
              <Input
                id="tx-tags"
                type="text"
                placeholder="e.g. work, groceries"
                {...register('tags')}
                className="mt-1"
              />
            </div>

            {serverError && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Transaction'}
              </Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
