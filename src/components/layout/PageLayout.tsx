import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-svh bg-background">
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar drawer ───────────────────────────────── */}
      {mobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar onClose={() => setMobileSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* ── Main area ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setMobileSidebarOpen((v) => !v)} />

        <main
          id="main-content"
          className={cn(
            'flex-1 overflow-y-auto',
            // bottom padding so content isn't hidden behind mobile bottom nav
            'pb-20 lg:pb-6',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
