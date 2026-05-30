import { type SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-9 w-full appearance-none rounded-md border border-input bg-background px-3 py-1 pr-8 text-sm text-foreground shadow-sm transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'aria-invalid:border-destructive',
      // Chevron via background SVG
      "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_0.5rem_center]",
      // Force option elements to use explicit colors so they stay readable
      // in both light and dark OS themes (native <select> ignores CSS variables
      // on <option> in most browsers, so we target the element directly)
      '[&_option]:bg-[hsl(222,84%,5%)] [&_option]:text-[hsl(210,40%,98%)]',
      className,
    )}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = 'Select'

export { Select }
