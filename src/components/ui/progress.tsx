import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number       // 0–100
  max?: number
  className?: string
  indicatorClassName?: string
  'aria-label'?: string
}

export function Progress({
  value,
  max = 100,
  className,
  indicatorClassName,
  'aria-label': ariaLabel,
}: ProgressProps) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100)

  // colour shifts at 90 % (budget alert threshold)
  const fillClass =
    percent >= 100
      ? 'bg-destructive'
      : percent >= 90
        ? 'bg-amber-500'
        : 'bg-primary'

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-300', fillClass, indicatorClassName)}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
