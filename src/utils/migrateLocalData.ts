import type { Transaction } from '@/types'
import { TRANSACTION_SCHEMA_VERSION } from '@/types'
import { getAllLocalTransactions, saveLocalTransaction } from '@/services/indexedDB'

type TransactionMigrationFn = (t: Transaction) => Transaction

/**
 * Data migrations keyed by the schema VERSION they migrate TO.
 *
 * Example for a future version 2:
 *   2: (t) => ({ ...t, newField: t.newField ?? 'defaultValue' }),
 */
const transactionMigrations: Record<number, TransactionMigrationFn> = {
  // Version 1 is the initial schema — no data migration needed
}

/**
 * Runs any outstanding IndexedDB data migrations for transactions belonging
 * to `userId`. Call this once after a successful sign-in.
 *
 * This handles Firestore _document_ schema changes (schemaVersion field),
 * not IndexedDB _store_ schema changes (those live in the `upgrade` callback
 * in indexedDB.ts).
 */
export async function migrateLocalTransactions(userId: string): Promise<void> {
  const transactions = await getAllLocalTransactions(userId)

  const stale = transactions.filter((t) => t.schemaVersion < TRANSACTION_SCHEMA_VERSION)
  if (stale.length === 0) return

  for (const t of stale) {
    let updated = { ...t }
    for (let v = t.schemaVersion + 1; v <= TRANSACTION_SCHEMA_VERSION; v++) {
      const migrate = transactionMigrations[v]
      if (migrate) updated = migrate(updated)
    }
    updated.schemaVersion = TRANSACTION_SCHEMA_VERSION
    await saveLocalTransaction(updated)
  }

  console.info(`[FinTrack] Migrated ${stale.length} local transaction(s) to schema v${TRANSACTION_SCHEMA_VERSION}.`)
}
