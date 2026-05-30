import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CATEGORIES, CATEGORY_LABELS, type Budget } from '@/types'

const budgetSchema = z.object({
  category: z.enum(CATEGORIES),
  limit: z
    .string()
    .min(1, 'Limit is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount greater than 0'),
})

type FormData = z.infer<typeof budgetSchema>

type NewBudgetInput = Omit<Budget, 'id' | 'userId'>

interface BudgetFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budget?: Budget
  month: string  // "YYYY-MM"
  onSubmit: (data: NewBudgetInput) => Promise<void>
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p role="alert" className="mt-1 text-xs text-destructive">{message}</p>
}

export function BudgetForm({ open, onOpenChange, budget, month, onSubmit }: BudgetFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const isEdit = !!budget

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: budget?.category ?? 'food',
      limit: budget ? String(budget.limit) : '',
    },
  })

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
      await onSubmit({ category: data.category, limit: Number(data.limit), month })
      handleClose()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to save budget.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent aria-label={isEdit ? 'Edit budget' : 'Set budget'}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Budget' : 'Set Budget'}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="space-y-4">
            <div>
              <Label htmlFor="budget-category">Category</Label>
              <Select
                id="budget-category"
                aria-invalid={!!errors.category}
                {...register('category')}
                className="mt-1"
                disabled={isEdit}  // category can't change on edit — create a new one instead
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </Select>
              <FieldError message={errors.category?.message} />
            </div>

            <div>
              <Label htmlFor="budget-limit">Monthly Limit (₹)</Label>
              <Input
                id="budget-limit"
                type="number"
                inputMode="decimal"
                placeholder="5000"
                min="1"
                step="1"
                aria-invalid={!!errors.limit}
                {...register('limit')}
                className="mt-1"
              />
              <FieldError message={errors.limit?.message} />
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
                {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Set Budget'}
              </Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
