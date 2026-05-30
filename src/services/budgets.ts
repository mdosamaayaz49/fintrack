import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { FirebaseError } from 'firebase/app'
import { db } from './firebase'
import { saveLocalBudget, deleteLocalBudget, getLocalBudgetsByMonth } from './indexedDB'
import type { Budget } from '@/types'

type NewBudgetInput = Omit<Budget, 'id' | 'userId'>

export async function addBudget(userId: string, input: NewBudgetInput): Promise<Budget> {
  const docRef = doc(collection(db, `users/${userId}/budgets`))

  const budget: Budget = {
    ...input,
    id: docRef.id,
    userId,
  }

  await saveLocalBudget(budget)

  try {
    await setDoc(docRef, budget)
    return budget
  } catch (error) {
    await deleteLocalBudget(budget.id)
    if (error instanceof FirebaseError) {
      // eslint-disable-next-line preserve-caught-error
      throw new Error('Failed to save budget. Please try again.')
    }
    throw error
  }
}

export async function updateBudget(
  userId: string,
  id: string,
  updates: Partial<Omit<Budget, 'id' | 'userId'>>,
): Promise<void> {
  const docRef = doc(db, `users/${userId}/budgets`, id)
  try {
    await updateDoc(docRef, updates)
  } catch (error) {
    if (error instanceof FirebaseError) {
      // eslint-disable-next-line preserve-caught-error
      throw new Error('Failed to update budget. Please try again.')
    }
    throw error
  }
}

export async function deleteBudget(userId: string, id: string): Promise<void> {
  await deleteLocalBudget(id)
  const docRef = doc(db, `users/${userId}/budgets`, id)
  try {
    await deleteDoc(docRef)
  } catch (error) {
    if (error instanceof FirebaseError) {
      // eslint-disable-next-line preserve-caught-error
      throw new Error('Failed to delete budget. Please try again.')
    }
    throw error
  }
}

export async function getBudgetsByMonth(userId: string, month: string): Promise<Budget[]> {
  try {
    const q = query(
      collection(db, `users/${userId}/budgets`),
      where('month', '==', month),
    )
    const snapshot = await getDocs(q)
    const budgets = snapshot.docs.map((d) => ({
      id: d.id,
      userId,
      ...(d.data() as Omit<Budget, 'id' | 'userId'>),
    }))

    await Promise.all(budgets.map(saveLocalBudget))
    return budgets
  } catch {
    return getLocalBudgetsByMonth(userId, month)
  }
}

/**
 * Returns total spending per budget for the given month.
 * Used to calculate budget progress bars and alert thresholds.
 */
export async function getBudgetUsage(
  userId: string,
  month: string,
  transactions: { category: Budget['category']; amount: number; type: string }[],
): Promise<Record<string, number>> {
  const budgets = await getBudgetsByMonth(userId, month)
  const usage: Record<string, number> = {}

  for (const budget of budgets) {
    const spent = transactions
      .filter((t) => t.type === 'expense' && t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0)
    usage[budget.id] = spent
  }

  return usage
}
