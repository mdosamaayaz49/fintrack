import { useEffect, lazy, Suspense, type ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { subscribeToAuthChanges } from '@/services/auth'
import { useAuthStore } from '@/store/authStore'
import { useNetworkSync } from '@/hooks/useNetworkSync'
import { ROUTES } from '@/types'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PageLayout } from '@/components/layout/PageLayout'
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator'
import { InstallBanner } from '@/components/pwa/InstallBanner'
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt'
import { Toaster } from '@/components/ui/toaster'

// Lazy-load every page — each becomes its own JS chunk.
// The auth page is kept in a separate chunk from the protected pages
// so unauthenticated users never download dashboard/analytics/charts code.
const AuthPage = lazy(() => import('@/pages/Auth'))
const DashboardPage = lazy(() => import('@/pages/Dashboard'))
const TransactionsPage = lazy(() => import('@/pages/Transactions'))
const AnalyticsPage = lazy(() => import('@/pages/Analytics'))
const BudgetsPage = lazy(() => import('@/pages/Budgets'))
const SettingsPage = lazy(() => import('@/pages/Settings'))

function FullPageLoader() {
  return (
    <div className="flex h-screen items-center justify-center" aria-label="Loading application">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuthStore()
  if (loading) return <FullPageLoader />
  if (!currentUser) return <Navigate to={ROUTES.AUTH} replace />
  return <PageLayout>{children}</PageLayout>
}

export default function App() {
  useNetworkSync()

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges()
    return unsubscribe
  }, [])

  return (
    <>
      <OfflineIndicator />
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          <Route
            path={ROUTES.AUTH}
            element={
              <ErrorBoundary>
                <AuthPage />
              </ErrorBoundary>
            }
          />
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <DashboardPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.TRANSACTIONS}
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <TransactionsPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ANALYTICS}
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <AnalyticsPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.BUDGETS}
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <BudgetsPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.SETTINGS}
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <SettingsPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
      </Suspense>
      <InstallBanner />
      <UpdatePrompt />
      <Toaster />
    </>
  )
}

