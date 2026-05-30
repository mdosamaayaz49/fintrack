import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'

// ── Firestore mock ─────────────────────────────────────────────────────────────
// All Firestore calls are intercepted so the sync service never hits the network.

const mockSetDoc = vi.fn().mockResolvedValue(undefined)
const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)
const mockDeleteDoc = vi.fn().mockResolvedValue(undefined)
const mockDoc = vi.fn((_db: unknown, path: string, id: string) => ({ path, id }))

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

async function freshModules() {
  // Fresh fake-indexeddb + module reset ensures no state bleeds between tests
  globalThis.indexedDB = new IDBFactory()
  vi.resetModules()
  const idb = await import('@/services/indexedDB')
  const sync = await import('@/services/sync')
  return { idb, sync }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('drainPendingQueue', () => {
  beforeEach(() => {
    mockSetDoc.mockClear()
    mockUpdateDoc.mockClear()
    mockDeleteDoc.mockClear()
    mockDoc.mockClear()
  })

  it('does nothing when the queue is empty', async () => {
    const { sync } = await freshModules()
    await sync.drainPendingQueue('user-1')
    expect(mockSetDoc).not.toHaveBeenCalled()
    expect(mockUpdateDoc).not.toHaveBeenCalled()
    expect(mockDeleteDoc).not.toHaveBeenCalled()
  })

  it('calls setDoc for a "create" operation and removes it from the queue', async () => {
    const { idb, sync } = await freshModules()

    await idb.enqueuePendingSync({
      userId: 'user-1',
      entityType: 'transaction',
      entityId: 'tx-1',
      operation: 'create',
      payload: { id: 'tx-1', type: 'expense', amount: 500, userId: 'user-1' } as unknown as import('@/types').Transaction,
    })

    await sync.drainPendingQueue('user-1')

    expect(mockSetDoc).toHaveBeenCalledOnce()
    const remaining = await idb.getPendingSyncItems('user-1')
    expect(remaining).toHaveLength(0)
  })

  it('calls updateDoc for an "update" operation', async () => {
    const { idb, sync } = await freshModules()

    await idb.enqueuePendingSync({
      userId: 'user-1',
      entityType: 'transaction',
      entityId: 'tx-2',
      operation: 'update',
      payload: { amount: 999 } as unknown as import('@/types').Transaction,
    })

    await sync.drainPendingQueue('user-1')

    expect(mockUpdateDoc).toHaveBeenCalledOnce()
    expect(await idb.getPendingSyncItems('user-1')).toHaveLength(0)
  })

  it('calls deleteDoc for a "delete" operation', async () => {
    const { idb, sync } = await freshModules()

    await idb.enqueuePendingSync({
      userId: 'user-1',
      entityType: 'transaction',
      entityId: 'tx-3',
      operation: 'delete',
      payload: undefined,
    })

    await sync.drainPendingQueue('user-1')

    expect(mockDeleteDoc).toHaveBeenCalledOnce()
    expect(await idb.getPendingSyncItems('user-1')).toHaveLength(0)
  })

  it('increments retryCount on failure and keeps the item in queue', async () => {
    const { idb, sync } = await freshModules()

    mockSetDoc.mockRejectedValueOnce(new Error('network error'))

    await idb.enqueuePendingSync({
      userId: 'user-1',
      entityType: 'transaction',
      entityId: 'tx-fail',
      operation: 'create',
      payload: undefined,
    })

    await sync.drainPendingQueue('user-1')

    const items = await idb.getPendingSyncItems('user-1')
    expect(items).toHaveLength(1)
    expect(items[0].retryCount).toBe(1)
  })

  it('drops an item that has reached MAX_RETRIES (3)', async () => {
    const { idb, sync } = await freshModules()

    await idb.enqueuePendingSync({
      userId: 'user-1',
      entityType: 'transaction',
      entityId: 'tx-exhausted',
      operation: 'create',
      payload: undefined,
    })

    const [item] = await idb.getPendingSyncItems('user-1')
    // Manually set retryCount to 3 (the MAX_RETRIES threshold)
    await idb.incrementRetryCount(item.id)
    await idb.incrementRetryCount(item.id)
    await idb.incrementRetryCount(item.id)

    await sync.drainPendingQueue('user-1')

    // Item should be dropped — setDoc should NOT have been called
    expect(mockSetDoc).not.toHaveBeenCalled()
    expect(await idb.getPendingSyncItems('user-1')).toHaveLength(0)
  })

  it('replays multiple queued items in order', async () => {
    const { idb, sync } = await freshModules()

    await idb.enqueuePendingSync({ userId: 'user-1', entityType: 'transaction', entityId: 'first', operation: 'create', payload: { id: 'first', userId: 'user-1' } as unknown as import('@/types').Transaction })
    await idb.enqueuePendingSync({ userId: 'user-1', entityType: 'transaction', entityId: 'second', operation: 'update', payload: { amount: 1 } as unknown as import('@/types').Transaction })

    await sync.drainPendingQueue('user-1')

    expect(mockSetDoc).toHaveBeenCalledOnce()
    expect(mockUpdateDoc).toHaveBeenCalledOnce()
    expect(await idb.getPendingSyncItems('user-1')).toHaveLength(0)
  })

  it('uses the budget collection path for budget entity type', async () => {
    const { idb, sync } = await freshModules()

    await idb.enqueuePendingSync({
      userId: 'user-1',
      entityType: 'budget',
      entityId: 'budget-1',
      operation: 'delete',
      payload: undefined,
    })

    await sync.drainPendingQueue('user-1')

    expect(mockDoc).toHaveBeenCalledWith(
      expect.anything(),
      'users/user-1/budgets',
      'budget-1',
    )
  })
})
