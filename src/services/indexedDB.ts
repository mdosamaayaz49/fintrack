import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Transaction, Budget, PendingSyncItem } from '@/types'

// Bump this version number when the IndexedDB object-store schema changes.
// Add a new migration block in the `upgrade` callback below.
const IDB_VERSION = 1

export interface FintrackDB extends DBSchema {
  transactions: {
    key: string
    value: Transaction
    indexes: {
      'by-userId': string
      'by-userId-date': [string, string]
    }
  }
  budgets: {
    key: string
    value: Budget
    indexes: {
      'by-userId-month': [string, string]
    }
  }
  pendingSync: {
    key: string
    value: PendingSyncItem
    indexes: {
      'by-userId': string
      'by-createdAt': number
    }
  }
}

// Module-level singleton promise — avoids reopening the DB on every call
let dbPromise: ReturnType<typeof openDB<FintrackDB>> | null = null

function getDB(): Promise<IDBPDatabase<FintrackDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FintrackDB>('fintrack-db', IDB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          // ── transactions ─────────────────────────────────────────────────
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' })
          txStore.createIndex('by-userId', 'userId', { unique: false })
          txStore.createIndex('by-userId-date', ['userId', 'date'], { unique: false })

          // ── budgets ───────────────────────────────────────────────────────
          const budgetStore = db.createObjectStore('budgets', { keyPath: 'id' })
          budgetStore.createIndex('by-userId-month', ['userId', 'month'], { unique: false })

          // ── pendingSync ───────────────────────────────────────────────────
          const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id' })
          syncStore.createIndex('by-userId', 'userId', { unique: false })
          syncStore.createIndex('by-createdAt', 'createdAt', { unique: false })
        }
        // Future: add `if (oldVersion < 2) { ... }` migration blocks here
      },
      blocked() {
        console.warn('[FinTrack IDB] Upgrade blocked — close other tabs and reload.')
      },
    })
  }
  return dbPromise
}

// ── Transactions ─────────────────────────────────────────────────────────────

export async function saveLocalTransaction(transaction: Transaction): Promise<void> {
  const db = await getDB()
  await db.put('transactions', transaction)
}

export async function getLocalTransaction(id: string): Promise<Transaction | undefined> {
  const db = await getDB()
  return db.get('transactions', id)
}

export async function getAllLocalTransactions(userId: string): Promise<Transaction[]> {
  const db = await getDB()
  return db.getAllFromIndex('transactions', 'by-userId', userId)
}

export async function getLocalTransactionsByMonth(
  userId: string,
  month: string,
): Promise<Transaction[]> {
  const db = await getDB()
  // Composite key range: [userId, "YYYY-MM-01"] → [userId, "YYYY-MM-31"]
  const range = IDBKeyRange.bound([userId, `${month}-01`], [userId, `${month}-31`])
  return db.getAllFromIndex('transactions', 'by-userId-date', range)
}

export async function deleteLocalTransaction(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('transactions', id)
}

// ── Budgets ───────────────────────────────────────────────────────────────────

export async function saveLocalBudget(budget: Budget): Promise<void> {
  const db = await getDB()
  await db.put('budgets', budget)
}

export async function getLocalBudgetsByMonth(userId: string, month: string): Promise<Budget[]> {
  const db = await getDB()
  const range = IDBKeyRange.only([userId, month])
  return db.getAllFromIndex('budgets', 'by-userId-month', range)
}

export async function deleteLocalBudget(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('budgets', id)
}

// ── Pending Sync Queue ────────────────────────────────────────────────────────

export async function enqueuePendingSync(
  item: Omit<PendingSyncItem, 'id' | 'createdAt' | 'retryCount'>,
): Promise<void> {
  const db = await getDB()
  const fullItem: PendingSyncItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    retryCount: 0,
  }
  await db.add('pendingSync', fullItem)
}

export async function getPendingSyncItems(userId: string): Promise<PendingSyncItem[]> {
  const db = await getDB()
  const items = await db.getAllFromIndex('pendingSync', 'by-userId', userId)
  // Replay in insertion order
  return items.sort((a, b) => a.createdAt - b.createdAt)
}

export async function removePendingSyncItem(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('pendingSync', id)
}

export async function incrementRetryCount(id: string): Promise<void> {
  const db = await getDB()
  const item = await db.get('pendingSync', id)
  if (item) {
    await db.put('pendingSync', { ...item, retryCount: item.retryCount + 1 })
  }
}
