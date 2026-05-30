import { describe, it, expect } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import { normalizeTransaction } from '../transactions'
import { TRANSACTION_SCHEMA_VERSION } from '@/types'

describe('normalizeTransaction', () => {
  it('passes through a well-formed transaction unchanged', () => {
    const result = normalizeTransaction('tx-1', {
      type: 'expense',
      amount: 500,
      category: 'food',
      description: 'Lunch',
      date: '2024-07-15',
      createdAt: 1721040000000,
      synced: true,
      schemaVersion: TRANSACTION_SCHEMA_VERSION,
      tags: ['work'],
      userId: 'user-1',
    })

    expect(result.id).toBe('tx-1')
    expect(result.type).toBe('expense')
    expect(result.amount).toBe(500)
    expect(result.category).toBe('food')
    expect(result.description).toBe('Lunch')
    expect(result.date).toBe('2024-07-15')
    expect(result.synced).toBe(true)
    expect(result.tags).toEqual(['work'])
    expect(result.userId).toBe('user-1')
  })

  it('defaults type to "expense" for unknown type values', () => {
    const result = normalizeTransaction('tx-1', { type: 'unknown' })
    expect(result.type).toBe('expense')
  })

  it('accepts "income" type', () => {
    const result = normalizeTransaction('tx-1', { type: 'income' })
    expect(result.type).toBe('income')
  })

  it('defaults amount to 0 for non-numeric values', () => {
    expect(normalizeTransaction('tx-1', { amount: 'bad' }).amount).toBe(0)
    expect(normalizeTransaction('tx-1', { amount: null }).amount).toBe(0)
    expect(normalizeTransaction('tx-1', { amount: -50 }).amount).toBe(0)
  })

  it('defaults category to "other" for unknown category', () => {
    expect(normalizeTransaction('tx-1', { category: 'luxury' }).category).toBe('other')
  })

  it('defaults description to empty string', () => {
    expect(normalizeTransaction('tx-1', {}).description).toBe('')
    expect(normalizeTransaction('tx-1', { description: 42 }).description).toBe('')
  })

  it('converts a Firestore Timestamp to milliseconds', () => {
    const ts = Timestamp.fromMillis(1721040000000)
    const result = normalizeTransaction('tx-1', { createdAt: ts })
    expect(result.createdAt).toBe(1721040000000)
  })

  it('accepts a numeric createdAt', () => {
    const result = normalizeTransaction('tx-1', { createdAt: 9999 })
    expect(result.createdAt).toBe(9999)
  })

  it('defaults createdAt to a recent timestamp when missing', () => {
    const before = Date.now()
    const result = normalizeTransaction('tx-1', {})
    expect(result.createdAt).toBeGreaterThanOrEqual(before)
  })

  it('defaults synced to true for non-boolean', () => {
    expect(normalizeTransaction('tx-1', { synced: 'yes' }).synced).toBe(true)
  })

  it('filters non-string entries from tags array', () => {
    const result = normalizeTransaction('tx-1', { tags: ['valid', 42, null, 'also-valid'] })
    expect(result.tags).toEqual(['valid', 'also-valid'])
  })

  it('defaults tags to [] when not an array', () => {
    expect(normalizeTransaction('tx-1', { tags: 'work' }).tags).toEqual([])
    expect(normalizeTransaction('tx-1', {}).tags).toEqual([])
  })

  it('defaults userId to empty string', () => {
    expect(normalizeTransaction('tx-1', {}).userId).toBe('')
  })

  it('sets schemaVersion from data', () => {
    const result = normalizeTransaction('tx-1', { schemaVersion: 3 })
    expect(result.schemaVersion).toBe(3)
  })

  it('defaults schemaVersion to TRANSACTION_SCHEMA_VERSION', () => {
    const result = normalizeTransaction('tx-1', {})
    expect(result.schemaVersion).toBe(TRANSACTION_SCHEMA_VERSION)
  })
})
