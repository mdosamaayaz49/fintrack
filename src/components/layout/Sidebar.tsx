import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart2,
  Target,
  Settings,
  IndianRupee,
} from 'lucide-react'
import { ROUTES } from '@/types'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', Icon: LayoutDashboard },
  { to: ROUTES.TRANSACTIONS, label: 'Transactions', Icon: ArrowLeftRight },
  { to: ROUTES.ANALYTICS, label: 'Analytics', Icon: BarChart2 },
  { to: ROUTES.BUDGETS, label: 'Budgets', Icon: Target },
  { to: ROUTES.SETTINGS, label: 'Settings', Icon: Settings },
] as const

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
          <IndianRupee className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
        </div>
        <span className="text-base font-bold text-foreground tracking-tight">FinTrack</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <ul className="space-y-0.5" role="list">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onClose}
                aria-label={label}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
