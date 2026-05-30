import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import {
  getPendingSyncItems,
  removePendingSyncItem,
  incrementRetryCount,
  saveLocalTransaction,
  deleteLocalTransaction,
  saveLocalBudget,
  deleteLocalBudget,
} from './indexedDB'
import type { PendingSyncItem, Transaction, Budget } from '@/types'

const MAX_RETRIES = 3

async function replayOperation(item: PendingSyncItem): Promise<void> {
  const collectionPath =
    item.entityType === 'transaction'
      ? `users/${item.userId}/transactions`
      : `users/${item.userId}/budgets`

  const docRef = doc(db, collectionPath, item.entityId)

  switch (item.operation) {
    case 'create':
      await setDoc(docRef, item.payload as Transaction | Budget)
      // Mark the local copy as synced
      if (item.entityType === 'transaction') {
        await saveLocalTransaction({ ...(item.payload as Transaction), synced: true })
      } else {
        await saveLocalBudget(item.payload as Budget)
      }
      break

    case 'update':
      await updateDoc(docRef, item.payload as Partial<Transaction | Budget>)
      break

    case 'delete':
      await deleteDoc(docRef)
      // Clean up local cache
      if (item.entityType === 'transaction') {
        await deleteLocalTransaction(item.entityId)
      } else {
        await deleteLocalBudget(item.entityId)
      }
      break
  }
}

/**
 * Replays all queued offline writes for a user against Firestore.
 * Call this when the app detects it has come back online.
 *
 * Operations are replayed in creation order. If an operation fails it is
 * retried up to MAX_RETRIES times before being discarded.
 */
export async function drainPendingQueue(userId: string): Promise<void> {
  const items = await getPendingSyncItems(userId)

  for (const item of items) {
    if (item.retryCount >= MAX_RETRIES) {
      console.warn('[FinTrack Sync] Dropping after max retries:', item)
      await removePendingSyncItem(item.id)
      continue
    }

    try {
      await replayOperation(item)
      await removePendingSyncItem(item.id)
    } catch (error) {
      console.error('[FinTrack Sync] Retry failed for item:', item.id, error)
      await incrementRetryCount(item.id)
    }
  }
}
