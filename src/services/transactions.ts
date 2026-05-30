import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore'
import { FirebaseError } from 'firebase/app'
import { db } from './firebase'
import {
  saveLocalTransaction,
  deleteLocalTransaction,
  getLocalTransactionsByMonth,
  enqueuePendingSync,
} from './indexedDB'
import { CATEGORIES, TRANSACTION_SCHEMA_VERSION, type Transaction } from '@/types'
import { todayISO } from '@/utils/formatDate'

// ── Normalization ─────────────────────────────────────────────────────────────

/**
 * Converts raw Firestore DocumentData into a fully-typed Transaction with
 * safe defaults for every field. Call this on every Firestore read.
 */
export function normalizeTransaction(id: string, data: DocumentData): Transaction {
  return {
    id,
    type: data.type === 'income' || data.type === 'expense' ? data.type : 'expense',
    amount: typeof data.amount === 'number' && data.amount > 0 ? data.amount : 0,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    category: CATEGORIES.includes(data.category) ? data.category : 'other',
    description: typeof data.description === 'string' ? data.description : '',
    date: typeof data.date === 'string' ? data.date : todayISO(),
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis()
        : typeof data.createdAt === 'number'
          ? data.createdAt
          : Date.now(),
    synced: typeof data.synced === 'boolean' ? data.synced : true,
    schemaVersion:
      typeof data.schemaVersion === 'number' ? data.schemaVersion : TRANSACTION_SCHEMA_VERSION,
    tags: Array.isArray(data.tags)
      ? (data.tags as unknown[]).filter((t): t is string => typeof t === 'string')
      : [],
    userId: typeof data.userId === 'string' ? data.userId : '',
  }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

type NewTransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'synced' | 'schemaVersion' | 'userId'>

export async function addTransaction(
  userId: string,
  input: NewTransactionInput,
): Promise<Transaction> {
  // Generate the Firestore document ID client-side so we have it before the network call
  const docRef = doc(collection(db, `users/${userId}/transactions`))

  const transaction: Transaction = {
    ...input,
    id: docRef.id,
    userId,
    createdAt: Date.now(),
    synced: false,
    schemaVersion: TRANSACTION_SCHEMA_VERSION,
  }

  // 1. Persist locally first — app stays responsive even if network is slow
  await saveLocalTransaction(transaction)

  if (!navigator.onLine) {
    await enqueuePendingSync({
      entityType: 'transaction',
      operation: 'create',
      entityId: transaction.id,
      payload: transaction,
      userId,
    })
    return transaction
  }

  try {
    await setDoc(docRef, {
      ...transaction,
      createdAt: serverTimestamp(),
    })
    const synced = { ...transaction, synced: true }
    await saveLocalTransaction(synced)
    return synced
  } catch (error) {
    if (error instanceof FirebaseError && isNetworkError(error)) {
      await enqueuePendingSync({
        entityType: 'transaction',
        operation: 'create',
        entityId: transaction.id,
        payload: transaction,
        userId,
      })
      return transaction
    }
    // Permanent error (e.g. rules rejection) — roll back local write
    await deleteLocalTransaction(transaction.id)
    throw new Error('Failed to save transaction. Please try again.')
  }
}

export async function updateTransaction(
  userId: string,
  id: string,
  updates: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'schemaVersion'>>,
): Promise<void> {
  const docRef = doc(db, `users/${userId}/transactions`, id)

  if (!navigator.onLine) {
    await enqueuePendingSync({
      entityType: 'transaction',
      operation: 'update',
      entityId: id,
      payload: updates as Transaction,
      userId,
    })
    return
  }

  try {
    await updateDoc(docRef, { ...updates, synced: true })
  } catch (error) {
    if (error instanceof FirebaseError && isNetworkError(error)) {
      await enqueuePendingSync({
        entityType: 'transaction',
        operation: 'update',
        entityId: id,
        payload: updates as Transaction,
        userId,
      })
      return
    }
    throw new Error('Failed to update transaction. Please try again.')
  }
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  const docRef = doc(db, `users/${userId}/transactions`, id)

  // Remove from local cache immediately for instant UI feedback
  await deleteLocalTransaction(id)

  if (!navigator.onLine) {
    await enqueuePendingSync({
      entityType: 'transaction',
      operation: 'delete',
      entityId: id,
      payload: undefined,
      userId,
    })
    return
  }

  try {
    await deleteDoc(docRef)
  } catch (error) {
    if (error instanceof FirebaseError && isNetworkError(error)) {
      await enqueuePendingSync({
        entityType: 'transaction',
        operation: 'delete',
        entityId: id,
        payload: undefined,
        userId,
      })
      return
    }
    throw new Error('Failed to delete transaction. Please try again.')
  }
}

/**
 * Fetches transactions for a given month from Firestore and caches them in IndexedDB.
 * Falls back to the local IndexedDB cache if Firestore is unavailable.
 */
export async function getTransactionsByMonth(
  userId: string,
  month: string,
): Promise<Transaction[]> {
  const startDate = `${month}-01`
  const endDate = `${month}-31`

  try {
    const q = query(
      collection(db, `users/${userId}/transactions`),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc'),
    )
    const snapshot = await getDocs(q)
    const transactions = snapshot.docs.map((d) => normalizeTransaction(d.id, d.data()))

    // Warm the local cache
    await Promise.all(transactions.map(saveLocalTransaction))

    return transactions
  } catch {
    // Firestore unavailable — serve from IndexedDB
    return getLocalTransactionsByMonth(userId, month)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isNetworkError(error: FirebaseError): boolean {
  return error.code === 'unavailable' || error.code === 'cancelled'
}
