const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatCurrency(amount: number): string {
  return INR_FORMATTER.format(amount)
}

/** Compact notation for charts/summary cards: ₹1.2L, ₹45K */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(1)}L`
  }
  if (amount >= 1_000) {
    return `₹${(amount / 1_000).toFixed(1)}K`
  }
  return formatCurrency(amount)
}
