import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { CATEGORY_COLORS, type Category } from '@/types'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'income' | 'expense' | 'category'
  category?: Category
}

export function Badge({ className, variant = 'default', category, children, style, ...props }: BadgeProps) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'

  const variantClass: Record<string, string> = {
    default: 'bg-secondary text-secondary-foreground',
    income: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    expense: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    category: '',
  }

  const categoryStyle =
    variant === 'category' && category
      ? {
          backgroundColor: `${CATEGORY_COLORS[category]}20`,
          color: CATEGORY_COLORS[category],
          ...style,
        }
      : style

  return (
    <span
      className={cn(base, variantClass[variant], className)}
      style={categoryStyle}
      {...props}
    >
      {children}
    </span>
  )
}
