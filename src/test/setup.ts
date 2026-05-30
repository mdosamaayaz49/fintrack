// src/test/setup.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase so unit tests never hit the network
vi.mock('@/services/firebase', () => ({
  db: {},
  auth: { currentUser: null },
  messaging: null,
}))

// Polyfill ALL IndexedDB globals (IDBRequest, IDBKeyRange, IDBFactory, etc.)
// fake-indexeddb/auto assigns each to globalThis as a side-effect
import 'fake-indexeddb/auto'