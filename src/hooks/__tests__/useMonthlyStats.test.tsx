import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useMonthlyStats } from '../useMonthlyStats'
import type { Transaction } from '@/types'

// ── Mock useTransactions so we don't need Firestore/IDB ──────────────────────

vi.mock('../useTransactions', () => ({
  useTransactions: vi.fn(),
}))

import { useTransactions } from '../useTransactions'
const mockUseTransactions = vi.mocked(useTransactions)

// ── Test wrapper with QueryClient ─────────────────────────────────────────────

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  type: 'expense',
  amount: 1000,
  category: 'food',
  description: '',
  date: '2024-07-10',
  createdAt: Date.now(),
  synced: true,
  schemaVersion: 1,
  tags: [],
  userId: 'user-1',
  ...overrides,
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useMonthlyStats', () => {
  it('returns zero stats when there are no transactions', () => {
    mockUseTransactions.mockReturnValue({ data: [], isLoading: false } as unknown as unknown as ReturnType<typeof useTransactions>)

    const { result } = renderHook(() => useMonthlyStats('user-1', '2024-07'), { wrapper })

    expect(result.current.stats.totalIncome).toBe(0)
    expect(result.current.stats.totalExpense).toBe(0)
    expect(result.current.stats.balance).toBe(0)
    expect(result.current.stats.byCategory).toEqual({})
  })

  it('sums income and expense separately', () => {
    mockUseTransactions.mockReturnValue({
      data: [
        makeTransaction({ id: 'i1', type: 'income', amount: 50000 }),
        makeTransaction({ id: 'e1', type: 'expense', amount: 20000 }),
        makeTransaction({ id: 'e2', type: 'expense', amount: 5000 }),
      ],
      isLoading: false,
    } as unknown as unknown as ReturnType<typeof useTransactions>)

    const { result } = renderHook(() => useMonthlyStats('user-1', '2024-07'), { wrapper })

    expect(result.current.stats.totalIncome).toBe(50000)
    expect(result.current.stats.totalExpense).toBe(25000)
    expect(result.current.stats.balance).toBe(25000)
  })

  it('computes negative balance when expenses exceed income', () => {
    mockUseTransactions.mockReturnValue({
      data: [
        makeTransaction({ id: 'i1', type: 'income', amount: 1000 }),
        makeTransaction({ id: 'e1', type: 'expense', amount: 3000 }),
      ],
      isLoading: false,
    } as unknown as unknown as ReturnType<typeof useTransactions>)

    const { result } = renderHook(() => useMonthlyStats('user-1', '2024-07'), { wrapper })

    expect(result.current.stats.balance).toBe(-2000)
  })

  it('groups expenses by category in byCategory', () => {
    mockUseTransactions.mockReturnValue({
      data: [
        makeTransaction({ id: 'e1', category: 'food', amount: 2000 }),
        makeTransaction({ id: 'e2', category: 'food', amount: 1000 }),
        makeTransaction({ id: 'e3', category: 'transport', amount: 500 }),
      ],
      isLoading: false,
    } as unknown as unknown as ReturnType<typeof useTransactions>)

    const { result } = renderHook(() => useMonthlyStats('user-1', '2024-07'), { wrapper })

    expect(result.current.stats.byCategory['food']).toBe(3000)
    expect(result.current.stats.byCategory['transport']).toBe(500)
  })

  it('does not include income transactions in byCategory', () => {
    mockUseTransactions.mockReturnValue({
      data: [
        makeTransaction({ id: 'i1', type: 'income', amount: 50000, category: 'salary' }),
      ],
      isLoading: false,
    } as unknown as unknown as ReturnType<typeof useTransactions>)

    const { result } = renderHook(() => useMonthlyStats('user-1', '2024-07'), { wrapper })

    expect(result.current.stats.byCategory['salary']).toBeUndefined()
  })

  it('passes through isLoading from useTransactions', () => {
    mockUseTransactions.mockReturnValue({ data: [], isLoading: true } as unknown as unknown as unknown as ReturnType<typeof useTransactions>)

    const { result } = renderHook(() => useMonthlyStats('user-1', '2024-07'), { wrapper })

    expect(result.current.isLoading).toBe(true)
  })

  it('sets month on the returned stats', () => {
    mockUseTransactions.mockReturnValue({ data: [], isLoading: false } as unknown as unknown as ReturnType<typeof useTransactions>)

    const { result } = renderHook(() => useMonthlyStats('user-1', '2024-07'), { wrapper })

    expect(result.current.stats.month).toBe('2024-07')
  })
})
