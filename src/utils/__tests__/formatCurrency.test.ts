import { describe, it, expect } from 'vitest'
import { formatCurrency, formatCurrencyCompact } from '../formatCurrency'

describe('formatCurrency', () => {
  it('formats whole rupees', () => {
    expect(formatCurrency(1000)).toContain('1,000')
  })

  it('includes ₹ symbol', () => {
    expect(formatCurrency(500)).toMatch(/₹/)
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toMatch(/₹/)
    expect(formatCurrency(0)).toContain('0')
  })

  it('formats decimal amounts', () => {
    const result = formatCurrency(999.5)
    expect(result).toContain('999')
  })

  it('uses en-IN grouping (1,00,000 style)', () => {
    // en-IN: 100000 → "1,00,000"
    expect(formatCurrency(100000)).toContain('1,00,000')
  })
})

describe('formatCurrencyCompact', () => {
  it('shows K for thousands', () => {
    expect(formatCurrencyCompact(45000)).toBe('₹45.0K')
  })

  it('shows L for lakhs', () => {
    expect(formatCurrencyCompact(120000)).toBe('₹1.2L')
  })

  it('falls back to full format below 1000', () => {
    const result = formatCurrencyCompact(500)
    expect(result).toMatch(/₹/)
    expect(result).toContain('500')
  })

  it('handles exactly 1000', () => {
    expect(formatCurrencyCompact(1000)).toBe('₹1.0K')
  })

  it('handles exactly 100000', () => {
    expect(formatCurrencyCompact(100000)).toBe('₹1.0L')
  })
})
