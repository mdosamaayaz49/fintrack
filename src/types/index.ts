// src/types/index.ts

export const CATEGORIES = [
  'food',
  'transport',
  'shopping',
  'health',
  'entertainment',
  'bills',
  'salary',
  'other',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABELS: Record<Category, string> = {
  food: 'Food & Dining',
  transport: 'Transport',
  shopping: 'Shopping',
  health: 'Health',
  entertainment: 'Entertainment',
  bills: 'Bills & Utilities',
  salary: 'Salary',
  other: 'Other',
}

export const CATEGORY_COLORS: Record<Category, string> = {
  food: '#1D9E75',
  transport: '#3B8BD4',
  shopping: '#EF9F27',
  health: '#E24B4A',
  entertainment: '#7F77DD',
  bills: '#D85A30',
  salary: '#639922',
  other: '#888780',
}

export const TRANSACTION_SCHEMA_VERSION = 1

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: Category
  description: string
  date: string           // "YYYY-MM-DD"
  createdAt: number      // Unix ms — stored as Firestore Timestamp, normalized to number
  synced: boolean
  schemaVersion: number
  tags: string[]
  userId: string
}

export interface Budget {
  id: string
  category: Category
  limit: number
  month: string          // "YYYY-MM"
  userId: string
}

export interface MonthlyStats {
  month: string          // "YYYY-MM"
  totalIncome: number
  totalExpense: number
  balance: number
  byCategory: Partial<Record<Category, number>>
  updatedAt: number
}

export interface AppUser {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
  currency: 'INR'
  fcmToken: string | null
}

// TanStack Query key factory — no magic strings
export const queryKeys = {
  transactions: (userId: string, month?: string) =>
    ['transactions', userId, month] as const,
  budgets: (userId: string, month: string) =>
    ['budgets', userId, month] as const,
  monthlyStats: (userId: string, month: string) =>
    ['monthlyStats', userId, month] as const,
} as const

// Route constants — no magic strings in <Link to="...">
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  ANALYTICS: '/analytics',
  BUDGETS: '/budgets',
  SETTINGS: '/settings',
} as const

// ── Offline / Background Sync ────────────────────────────────────────────────

export type SyncOperation = 'create' | 'update' | 'delete'
export type SyncEntityType = 'transaction' | 'budget'

export interface PendingSyncItem {
  /** UUID generated locally before the Firestore write attempt */
  id: string
  entityType: SyncEntityType
  operation: SyncOperation
  /** The Firestore document ID being operated on */
  entityId: string
  /** Full document for create/update; undefined for delete */
  payload: Transaction | Budget | undefined
  userId: string
  createdAt: number   // Unix ms — used to replay operations in order
  retryCount: number
}