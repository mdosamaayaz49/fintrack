import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatDate, formatDateShort, formatMonth, todayISO, currentMonthISO } from '../formatDate'

describe('formatDate', () => {
  it('formats a valid ISO date', () => {
    expect(formatDate('2024-01-15')).toBe('Jan 15, 2024')
  })

  it('returns original string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  it('handles end of year', () => {
    expect(formatDate('2024-12-31')).toBe('Dec 31, 2024')
  })
})

describe('formatDateShort', () => {
  it('formats to compact form', () => {
    expect(formatDateShort('2024-03-07')).toBe('7 Mar')
  })

  it('returns original string for invalid date', () => {
    expect(formatDateShort('invalid')).toBe('invalid')
  })
})

describe('formatMonth', () => {
  it('formats YYYY-MM to full month name and year', () => {
    expect(formatMonth('2024-06')).toBe('June 2024')
  })

  it('returns original string for invalid month', () => {
    expect(formatMonth('bad-input')).toBe('bad-input')
  })
})

describe('todayISO', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-07-20T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns today in YYYY-MM-DD format', () => {
    expect(todayISO()).toBe('2024-07-20')
  })
})

describe('currentMonthISO', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-07-20T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns current month in YYYY-MM format', () => {
    expect(currentMonthISO()).toBe('2024-07')
  })
})
