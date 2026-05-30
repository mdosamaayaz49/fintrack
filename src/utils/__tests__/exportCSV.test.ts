import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportTransactionsToCSV } from '../exportCSV'
import type { Transaction } from '@/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  type: 'expense',
  amount: 1500,
  category: 'food',
  description: 'Lunch',
  date: '2024-07-15',
  createdAt: 1721040000000,
  synced: true,
  schemaVersion: 1,
  tags: ['work'],
  userId: 'user-1',
  ...overrides,
})

// ── Mocks ─────────────────────────────────────────────────────────────────────

let capturedBlob: Blob | null = null

const mockAnchor = {
  href: '',
  download: '',
  click: vi.fn(),
}

beforeEach(() => {
  capturedBlob = null
  mockAnchor.click.mockClear()

  vi.stubGlobal(
    'URL',
    class {
      static createObjectURL(blob: Blob) {
        capturedBlob = blob
        return 'blob:mock-url'
      }
      static revokeObjectURL() {}
    },
  )

  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') return mockAnchor as unknown as HTMLElement
    return document.createElement(tag)
  })

  vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as unknown as Node)
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as unknown as Node)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('exportTransactionsToCSV', () => {
  it('triggers an anchor click to download', () => {
    exportTransactionsToCSV([makeTransaction()])
    expect(mockAnchor.click).toHaveBeenCalledOnce()
  })

  it('sets filename with .csv extension', () => {
    exportTransactionsToCSV([makeTransaction()])
    expect(mockAnchor.download).toMatch(/^fintrack-transactions-\d{4}-\d{2}-\d{2}\.csv$/)
  })

  it('produces a UTF-8 CSV blob', () => {
    exportTransactionsToCSV([makeTransaction()])
    expect(capturedBlob).not.toBeNull()
    expect(capturedBlob!.type).toContain('text/csv')
  })

  it('includes BOM for Excel UTF-8 compatibility', async () => {
    exportTransactionsToCSV([makeTransaction()])
    // Check the actual bytes — UTF-8 BOM is EF BB BF
    const buf = await capturedBlob!.arrayBuffer()
    const bytes = new Uint8Array(buf)
    expect(bytes[0]).toBe(0xef)
    expect(bytes[1]).toBe(0xbb)
    expect(bytes[2]).toBe(0xbf)
  })

  it('includes header row', async () => {
    exportTransactionsToCSV([makeTransaction()])
    const text = await capturedBlob!.text()
    expect(text).toContain('Date,Type,Category,Description,Amount (INR),Tags')
  })

  it('includes transaction data', async () => {
    exportTransactionsToCSV([makeTransaction()])
    const text = await capturedBlob!.text()
    expect(text).toContain('expense')
    expect(text).toContain('Food')
    expect(text).toContain('1500')
    expect(text).toContain('work')
  })

  it('escapes cells containing commas', async () => {
    exportTransactionsToCSV([makeTransaction({ description: 'Coffee, extra shot' })])
    const text = await capturedBlob!.text()
    expect(text).toContain('"Coffee, extra shot"')
  })

  it('escapes cells containing double-quotes', async () => {
    exportTransactionsToCSV([makeTransaction({ description: 'He said "hello"' })])
    const text = await capturedBlob!.text()
    expect(text).toContain('"He said ""hello"""')
  })

  it('sorts rows newest-first', async () => {
    const older = makeTransaction({ id: 'tx-1', date: '2024-01-01', description: 'Old' })
    const newer = makeTransaction({ id: 'tx-2', date: '2024-12-31', description: 'New' })
    exportTransactionsToCSV([older, newer])
    const text = await capturedBlob!.text()
    expect(text.indexOf('New')).toBeLessThan(text.indexOf('Old'))
  })

  it('handles empty array gracefully (only header row)', async () => {
    exportTransactionsToCSV([])
    const text = await capturedBlob!.text()
    const lines = text.trim().split('\r\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('Date')
  })

  it('joins multiple tags with semicolon', async () => {
    exportTransactionsToCSV([makeTransaction({ tags: ['food', 'work'] })])
    const text = await capturedBlob!.text()
    expect(text).toContain('food; work')
  })
})
