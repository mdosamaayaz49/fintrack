import { format, parseISO, isValid } from 'date-fns'

/** "2024-01-15" → "Jan 15, 2024" */
export function formatDate(dateString: string): string {
  const date = parseISO(dateString)
  return isValid(date) ? format(date, 'MMM d, yyyy') : dateString
}

/** "2024-01-15" → "15 Jan" — compact form for chart axes */
export function formatDateShort(dateString: string): string {
  const date = parseISO(dateString)
  return isValid(date) ? format(date, 'd MMM') : dateString
}

/** "2024-01" → "January 2024" */
export function formatMonth(month: string): string {
  const date = parseISO(`${month}-01`)
  return isValid(date) ? format(date, 'MMMM yyyy') : month
}

/** Returns today as "YYYY-MM-DD" */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Returns current month as "YYYY-MM" */
export function currentMonthISO(): string {
  return format(new Date(), 'yyyy-MM')
}
