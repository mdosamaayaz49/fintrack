import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import type { Transaction, Budget } from '@/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  type: 'expense',
  amount: 1500,
  category: 'food',
  description: 'Lunch',
  date: '2024-07-15',
  createdAt: Date.now(),
  synced: false,
  schemaVersion: 1,
  tags: [],
  userId: 'user-1',
  ...overrides,
})

const makeBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: 'budget-1',
  userId: 'user-1',
  category: 'food',
  limit: 5000,
  month: '2024-07',
  ...overrides,
})

// Reset fake-indexeddb between tests so state doesn't bleed across
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  // Reset the module-level DB singleton so it re-opens against the fresh IDB
  vi.resetModules()
})

// ── Transaction CRUD ──────────────────────────────────────────────────────────

describe('saveLocalTransaction / getLocalTransaction', () => {
  it('saves and retrieves a transaction by id', async () => {
    const { saveLocalTransaction, getLocalTransaction } = await import('../indexedDB')
    const tx = makeTransaction()
    await saveLocalTransaction(tx)
    const result = await getLocalTransaction('tx-1')
    expect(result).toMatchObject({ id: 'tx-1', amount: 1500 })
  })

  it('returns undefined for a non-existent id', async () => {
    const { getLocalTransaction } = await import('../indexedDB')
    const result = await getLocalTransaction('does-not-exist')
    expect(result).toBeUndefined()
  })

  it('upserts (overwrites) an existing transaction', async () => {
    const { saveLocalTransaction, getLocalTransaction } = await import('../indexedDB')
    await saveLocalTransaction(makeTransaction({ amount: 100 }))
    await saveLocalTransaction(makeTransaction({ amount: 200 }))
    const result = await getLocalTransaction('tx-1')
    expect(result!.amount).toBe(200)
  })
})

describe('getLocalTransactionsByMonth', () => {
  it('returns only transactions in the requested month', async () => {
    const { saveLocalTransaction, getLocalTransactionsByMonth } = await import('../indexedDB')
    await saveLocalTransaction(makeTransaction({ id: 'tx-jul', date: '2024-07-15' }))
    await saveLocalTransaction(makeTransaction({ id: 'tx-aug', date: '2024-08-01' }))

    const results = await getLocalTransactionsByMonth('user-1', '2024-07')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('tx-jul')
  })

  it('returns empty array when no transactions match', async () => {
    const { getLocalTransactionsByMonth } = await import('../indexedDB')
    const results = await getLocalTransactionsByMonth('user-1', '2099-01')
    expect(results).toHaveLength(0)
  })

  it('does not return transactions belonging to another user', async () => {
    const { saveLocalTransaction, getLocalTransactionsByMonth } = await import('../indexedDB')
    await saveLocalTransaction(makeTransaction({ id: 'tx-other', userId: 'user-2', date: '2024-07-10' }))
    const results = await getLocalTransactionsByMonth('user-1', '2024-07')
    expect(results).toHaveLength(0)
  })
})

describe('deleteLocalTransaction', () => {
  it('removes the transaction', async () => {
    const { saveLocalTransaction, deleteLocalTransaction, getLocalTransaction } = await import('../indexedDB')
    await saveLocalTransaction(makeTransaction())
    await deleteLocalTransaction('tx-1')
    expect(await getLocalTransaction('tx-1')).toBeUndefined()
  })
})

// ── Budget CRUD ───────────────────────────────────────────────────────────────

describe('saveLocalBudget / getLocalBudgetsByMonth', () => {
  it('saves and retrieves budgets by month', async () => {
    const { saveLocalBudget, getLocalBudgetsByMonth } = await import('../indexedDB')
    await saveLocalBudget(makeBudget())
    const results = await getLocalBudgetsByMonth('user-1', '2024-07')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('budget-1')
  })

  it('does not return budgets from a different month', async () => {
    const { saveLocalBudget, getLocalBudgetsByMonth } = await import('../indexedDB')
    await saveLocalBudget(makeBudget({ month: '2024-08' }))
    const results = await getLocalBudgetsByMonth('user-1', '2024-07')
    expect(results).toHaveLength(0)
  })
})

describe('deleteLocalBudget', () => {
  it('removes the budget', async () => {
    const { saveLocalBudget, deleteLocalBudget, getLocalBudgetsByMonth } = await import('../indexedDB')
    await saveLocalBudget(makeBudget())
    await deleteLocalBudget('budget-1')
    const results = await getLocalBudgetsByMonth('user-1', '2024-07')
    expect(results).toHaveLength(0)
  })
})

// ── Pending Sync Queue ────────────────────────────────────────────────────────

describe('enqueuePendingSync / getPendingSyncItems', () => {
  it('enqueues an item and returns it', async () => {
    const { enqueuePendingSync, getPendingSyncItems } = await import('../indexedDB')
    await enqueuePendingSync({
      userId: 'user-1',
      entityType: 'transaction',
      entityId: 'tx-1',
      operation: 'create',
      payload: makeTransaction(),
    })
    const items = await getPendingSyncItems('user-1')
    expect(items).toHaveLength(1)
    expect(items[0].entityId).toBe('tx-1')
    expect(items[0].retryCount).toBe(0)
  })

  it('returns items in insertion order', async () => {
    const { enqueuePendingSync, getPendingSyncItems } = await import('../indexedDB')
    // Use a strictly-incrementing spy so every Date.now() call (including
    // any internal fake-indexeddb calls) returns a larger value than the last,
    // guaranteeing distinct createdAt values across the two inserts.
    let ts = 0
    const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => ++ts)
    await enqueuePendingSync({ userId: 'order-user', entityType: 'transaction', entityId: 'first', operation: 'create', payload: undefined })
    await enqueuePendingSync({ userId: 'order-user', entityType: 'transaction', entityId: 'second', operation: 'create', payload: undefined })
    dateSpy.mockRestore()
    const items = await getPendingSyncItems('order-user')
    expect(items[0].entityId).toBe('first')
    expect(items[1].entityId).toBe('second')
  })
})

describe('removePendingSyncItem', () => {
  it('removes item from queue', async () => {
    const { enqueuePendingSync, getPendingSyncItems, removePendingSyncItem } = await import('../indexedDB')
    await enqueuePendingSync({ userId: 'user-1', entityType: 'transaction', entityId: 'tx-1', operation: 'delete', payload: undefined })
    const [item] = await getPendingSyncItems('user-1')
    await removePendingSyncItem(item.id)
    const remaining = await getPendingSyncItems('user-1')
    expect(remaining).toHaveLength(0)
  })
})

describe('incrementRetryCount', () => {
  it('increments retry count by 1', async () => {
    const { enqueuePendingSync, getPendingSyncItems, incrementRetryCount } = await import('../indexedDB')
    await enqueuePendingSync({ userId: 'user-1', entityType: 'transaction', entityId: 'tx-1', operation: 'update', payload: undefined })
    const [item] = await getPendingSyncItems('user-1')
    await incrementRetryCount(item.id)
    const [updated] = await getPendingSyncItems('user-1')
    expect(updated.retryCount).toBe(1)
  })
})
