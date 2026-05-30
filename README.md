# FinTrack — Expense & Budget Tracker

A production-grade, offline-first Progressive Web App (PWA) for tracking personal income, expenses, and budgets. Built for the Indian market (₹ INR) with real-time cloud sync, push notifications, and a clean mobile-first UI that installs natively on any device.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Firebase Setup](#firebase-setup)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Build & Deployment](#build--deployment)
- [PWA Behaviour](#pwa-behaviour)
- [Security Model](#security-model)
- [Data Models](#data-models)

---

## Features

| Area | Details |
|---|---|
| **Transactions** | Add, edit, delete income and expense entries with categories, tags, and dates |
| **Budgets** | Set per-category monthly spending limits; track live progress against real spend |
| **Analytics** | Spending-by-category donut chart, 6-month income/expense bar chart, daily line chart |
| **Offline-first** | Full read/write when offline via IndexedDB; queued mutations replay automatically when the connection returns |
| **Background Sync** | Workbox `BackgroundSync` retries failed Firestore writes for up to 24 hours |
| **Push Notifications** | FCM push notifications via a dedicated Firebase Messaging service worker |
| **PWA Install** | Installable on Android, iOS, and desktop Chrome; custom in-app install prompt |
| **Auto-update** | Service worker update prompt notifies users when a new version is deployed |
| **CSV Export** | One-click export of any month's transactions with UTF-8 BOM (Excel-compatible) |
| **Auth** | Email/password and Google OAuth sign-in; user profile persisted in Firestore |
| **Dark mode** | System-preference-aware via `prefers-color-scheme`; Tailwind v4 design tokens |

---

## Tech Stack

### Runtime

| Layer | Library | Version |
|---|---|---|
| UI framework | React | 19 |
| Language | TypeScript | 6 — strict mode, `noUnusedLocals`, `erasableSyntaxOnly` |
| Build tool | Vite | 8 |
| Routing | React Router DOM | 7 |
| Server state | TanStack Query | 5 |
| Client state | Zustand | 5 |
| Forms & validation | React Hook Form + Zod | 7 / 4 |
| Styling | Tailwind CSS | 4 — `@theme` design tokens |
| Component primitives | shadcn/ui (base-nova) + Base UI | — |
| Charts | Recharts | 3 |
| Local persistence | `idb` (IndexedDB wrapper) | 8 |
| Backend / DB | Firebase (Firestore, Auth, FCM) | 12 |
| PWA | vite-plugin-pwa + Workbox | 1.3 / 7 |
| Date utilities | date-fns | 4 |

### Dev / Test

| Tool | Purpose |
|---|---|
| Vitest | Unit test runner |
| React Testing Library | Component tests |
| fake-indexeddb | IDB tests without a real browser |
| ESLint + Prettier | Lint and format |
| GitHub Actions | CI (lint → type-check → test → build) + CD (Firebase Hosting deploy) |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     React App                       │
│  Pages (lazy-loaded) → Hooks → Services             │
│                                                     │
│  TanStack Query ←→ Firestore (online)               │
│                ←→ IndexedDB  (offline / cache)      │
│                                                     │
│  Zustand stores: authStore · uiStore · toastStore   │
└─────────────────────────────┬───────────────────────┘
                              │ Service Worker (Workbox)
              ┌───────────────┴──────────────┐
              │   NetworkFirst: Firestore     │
              │   BackgroundSync: mutations   │
              │   CacheFirst: static assets  │
              └───────────────┬──────────────┘
                              │ Separate SW
              ┌───────────────┴──────────────┐
              │  firebase-messaging-sw.js     │
              │  FCM background messages      │
              └──────────────────────────────┘
```

### Offline-first data flow

1. **Write** — mutations write to IndexedDB first (instant), then enqueue a `PendingSyncItem`.
2. **Online** — `useNetworkSync` hook drains the pending queue via `drainPendingQueue()`, replaying each operation against Firestore in insertion order. Items are retried up to 3 times before being dropped.
3. **Read** — TanStack Query serves from its in-memory cache; cold loads pull from Firestore and populate IndexedDB for subsequent offline reads.
4. **Background** — Workbox `BackgroundSync` independently retries failed Firestore network requests for up to 24 hours.

### Code splitting

All six pages are lazy-loaded (`React.lazy` + `Suspense`). Vendor bundles are manually chunked by domain:

| Chunk | Contents |
|---|---|
| `vendor-react` | react, react-dom |
| `vendor-router` | react-router-dom |
| `vendor-firebase-firestore` | firebase/firestore |
| `vendor-firebase-auth` | firebase/auth |
| `vendor-firebase-app` | firebase core |
| `vendor-firebase-messaging` | firebase/messaging |
| `vendor-recharts` | recharts + d3 helpers |
| `vendor-forms` | react-hook-form, @hookform/resolvers, zod |
| `vendor-query` | @tanstack/react-query |
| `vendor-datefns` | date-fns |
| `vendor-idb` | idb |

Largest chunk after gzip: `vendor-recharts` ~111 KB. No chunk exceeds 600 KB raw.

---

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- A **Firebase project** with Firestore, Authentication, and Cloud Messaging enabled

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/your-username/fintrack.git
cd fintrack

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in your Firebase credentials — see Environment Variables below

# 4. Start the dev server (PWA service worker enabled in dev)
npm run dev
```

The app is available at `http://localhost:5173`.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values from your Firebase project console (**Project Settings → General → Your apps**).

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=        # Firebase Cloud Messaging → Web Push certificates
```

> **Never commit `.env.local`** — it is gitignored. For CI/CD, add these as GitHub repository secrets (Settings → Secrets and variables → Actions).

---

## Firebase Setup

### 1. Enable services

In the Firebase console, enable:

- **Authentication** — Email/Password and Google providers
- **Firestore Database** — Start in production mode (rules are already in this repo)
- **Cloud Messaging** — Generate a VAPID key pair under Web Push certificates

### 2. Deploy Firestore rules and indexes

```bash
# Install Firebase CLI (once)
npm install -g firebase-tools
firebase login

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy composite indexes (required for category/date queries)
firebase deploy --only firestore:indexes
```

### 3. Firestore data structure

```
users/
  {uid}/
    displayName, email, currency, createdAt
    transactions/
      {txId}/   ← Transaction document
    budgets/
      {budgetId}/  ← Budget document
```

All user data lives under `users/{uid}/**`. Firestore rules enforce ownership on every read/write and validate field presence, `amount > 0`, and allowed enum values before any data is persisted.

### 4. FCM service worker

`public/firebase-messaging-sw.js` uses placeholder tokens (`self.__FIREBASE_API_KEY__`, etc.) that are replaced with real values at build time by the custom `firebaseMessagingSWPlugin` in `vite.config.ts`. No credentials are ever committed to source control.

---

## Project Structure

```
src/
├── assets/
├── components/
│   ├── budgets/             # BudgetCard, BudgetForm, BudgetProgressBar
│   ├── charts/              # SpendingPieChart, MonthlyBarChart, DailyLineChart
│   ├── dashboard/           # SummaryCards, RecentTransactions, BudgetProgress
│   ├── layout/              # PageLayout, Navbar, Sidebar
│   ├── pwa/                 # InstallBanner, OfflineIndicator, UpdatePrompt
│   ├── transactions/        # TransactionCard, TransactionForm, TransactionList
│   ├── ui/                  # Primitive components (Button, Card, Dialog, Select…)
│   └── ErrorBoundary.tsx
├── hooks/
│   ├── useBudgets.ts        # TanStack Query CRUD for budgets
│   ├── useTransactions.ts   # TanStack Query CRUD for transactions
│   ├── useMonthlyStats.ts   # Derived monthly aggregate (income, expense, balance)
│   ├── useNetworkSync.ts    # Drains pending queue on reconnect
│   ├── useOnlineStatus.ts   # navigator.onLine + online/offline events
│   └── usePWAInstall.ts     # BeforeInstallPromptEvent capture
├── pages/                   # Auth, Dashboard, Transactions, Analytics, Budgets, Settings
├── services/
│   ├── auth.ts              # Email/Google sign-in, sign-out, auth state listener
│   ├── budgets.ts           # Firestore + IndexedDB budget operations
│   ├── firebase.ts          # App, db, auth, lazy messaging singleton exports
│   ├── indexedDB.ts         # IDB schema v1, CRUD helpers, pending-sync queue
│   ├── notifications.ts     # FCM permission request + token registration
│   ├── sync.ts              # drainPendingQueue — replays offline mutations
│   └── transactions.ts      # Firestore + IndexedDB transaction operations
├── store/
│   ├── authStore.ts         # currentUser, loading flag
│   ├── toastStore.ts        # Toast notification queue
│   └── uiStore.ts           # sidebarOpen, activeMonth ("YYYY-MM")
├── types/
│   └── index.ts             # All types, category constants, queryKeys factory
├── utils/
│   ├── exportCSV.ts         # CSV export with UTF-8 BOM
│   ├── formatCurrency.ts    # INR Intl.NumberFormat helpers (compact + full)
│   └── formatDate.ts        # Month and date display helpers
├── App.tsx                  # Root router with lazy page loading + PWA overlays
├── main.tsx                 # Entry — QueryClientProvider + BrowserRouter
└── index.css                # Tailwind v4 @theme tokens, skip-link, focus styles

public/
├── firebase-messaging-sw.js # FCM background handler (tokens replaced at build)
├── favicon.svg
├── pwa-192x192.png
└── pwa-512x512.png

.github/
└── workflows/
    ├── ci.yml               # PR gate: lint → type-check → test → build
    └── deploy.yml           # main deploy: same gates → Firebase Hosting
```

---

## Available Scripts

```bash
npm run dev              # Vite dev server at http://localhost:5173
npm run build            # tsc -b then Vite production build → dist/
npm run type-check       # TypeScript type-check only, no emit
npm run lint             # ESLint across the entire project
npm run preview          # Serve dist/ locally to verify the production build
npm test                 # Run all tests once (CI mode)
npm run test:watch       # Vitest in interactive watch mode
npm run test:coverage    # Tests + V8 coverage report
```

---

## Testing

```bash
npm test

# Test Files  7 passed (7)
# Tests       74 passed (74)
```

| Suite | File | Tests |
|---|---|---|
| IndexedDB CRUD + sync queue | `services/__tests__/indexedDB.test.ts` | 14 |
| Offline sync drain | `services/__tests__/sync.test.ts` | 8 |
| Transaction normalization | `services/__tests__/normalizeTransaction.test.ts` | 15 |
| `useMonthlyStats` hook | `hooks/__tests__/useMonthlyStats.test.tsx` | 7 |
| CSV export | `utils/__tests__/exportCSV.test.ts` | 11 |
| Currency formatting | `utils/__tests__/formatCurrency.test.ts` | 10 |
| Date formatting | `utils/__tests__/formatDate.test.ts` | 9 |

**Test setup highlights:**

- `fake-indexeddb/auto` (imported in `src/test/setup.ts`) polyfills all IDB globals — no browser required.
- Firebase is fully mocked via `vi.mock` so tests never make real network calls.
- IndexedDB tests use isolated dynamic imports (`await import(...)`) per test to prevent cross-test state leakage.
- The `Date.now()` spy uses a strictly-incrementing implementation to guarantee distinct `createdAt` values even when multiple async IDB operations complete within the same millisecond.

---

## Build & Deployment

### Manual deploy

```bash
npm run build
firebase deploy --only hosting
```

### GitHub Actions (automated)

**`ci.yml`** — runs on every PR and non-`main` push:

```
Install → Lint → Type-check → Test → Build
```

Build uses placeholder env vars so the pipeline passes without real Firebase credentials.

**`deploy.yml`** — runs on every push to `main`:

```
Install → Lint → Type-check → Test → Build (real secrets) → Firebase Hosting
```

**Required GitHub secrets:**

| Secret | Where to find it |
|---|---|
| `VITE_FIREBASE_*` | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_VAPID_KEY` | Firebase Console → Cloud Messaging → Web Push certificates |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Console → Project Settings → Service Accounts → Generate new private key |

### Cache headers (firebase.json)

| Path | Cache-Control |
|---|---|
| `/assets/**` | `public, max-age=31536000, immutable` (content-hashed) |
| `/sw.js` | `no-cache, no-store, must-revalidate` (always check for updates) |
| `/workbox-*.js` | `public, max-age=31536000, immutable` |

---

## PWA Behaviour

| Scenario | Behaviour |
|---|---|
| First visit (online) | App shell precached by Workbox; Firestore data fetched and cached |
| Subsequent visit (online) | App loads instantly from cache; data revalidated in background |
| Offline visit | Full app available from service worker; reads served from IndexedDB |
| Offline write | Saved to IndexedDB + enqueued in pending-sync store |
| Back online | `useNetworkSync` detects `online` event → `drainPendingQueue` replays mutations |
| Persistent failure | Items retried up to 3× then dropped; Workbox BackgroundSync independently retries for 24 h |
| New version deployed | In-app update prompt appears; "Update" click activates new SW and reloads |
| Install | `BeforeInstallPromptEvent` captured; custom banner shown after 3 s |

---

## Security Model

- **Firestore rules** enforce `request.auth.uid == userId` on every collection path — cross-user data access is impossible at the database level regardless of client-side code.
- **Field validation in rules** rejects documents missing required fields or with invalid `amount`/`type` values before they reach the database.
- **Firebase API keys are not secrets** — they identify the project and are safe to expose in client-side code. Authorization is entirely handled by Firebase Auth tokens and Firestore rules.
- **No credentials in source control** — the FCM service worker uses placeholder tokens replaced at build time; `.env.local` is gitignored.
- For production hardening, layer on [Firebase App Check](https://firebase.google.com/docs/app-check) (attestation) and a `Content-Security-Policy` header in `firebase.json`.

---

## Data Models

```typescript
interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number          // positive INR value
  category: Category
  description: string
  date: string            // "YYYY-MM-DD"
  createdAt: number       // Unix ms
  synced: boolean         // false while pending upload
  schemaVersion: number   // bumped on breaking schema changes
  tags: string[]
  userId: string
}

interface Budget {
  id: string
  category: Category
  limit: number           // monthly spending limit in INR
  month: string           // "YYYY-MM"
  userId: string
}

type Category =
  | 'food'           // Food & Dining
  | 'transport'      // Transport
  | 'shopping'       // Shopping
  | 'health'         // Health
  | 'entertainment'  // Entertainment
  | 'bills'          // Bills & Utilities
  | 'salary'         // Salary
  | 'other'          // Other
```

---

## License

MIT
