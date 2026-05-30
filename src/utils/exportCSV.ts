import type { Transaction } from '@/types'
import { CATEGORY_LABELS } from '@/types'
import { formatDate } from './formatDate'

function escapeCSVCell(value: string | number): string {
  const str = String(value)
  // RFC 4180: wrap in quotes if the value contains a comma, newline, or double-quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportTransactionsToCSV(transactions: Transaction[]): void {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (INR)', 'Tags']

  const rows = transactions
    .slice() // avoid mutating the original array
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) => [
      escapeCSVCell(formatDate(t.date)),
      escapeCSVCell(t.type),
      escapeCSVCell(CATEGORY_LABELS[t.category]),
      escapeCSVCell(t.description),
      escapeCSVCell(t.amount),
      escapeCSVCell(t.tags.join('; ')),
    ])

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `fintrack-transactions-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
