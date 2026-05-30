import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, BarChart2, Target, Settings, ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { ROUTES } from '@/types'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'
import { formatMonth } from '@/utils/formatDate'
import { format, addMonths, parseISO, subMonths } from 'date-fns'

const BOTTOM_NAV = [
  { to: ROUTES.DASHBOARD, label: 'Home', Icon: LayoutDashboard },
  { to: ROUTES.TRANSACTIONS, label: 'Transactions', Icon: ArrowLeftRight },
  { to: ROUTES.ANALYTICS, label: 'Analytics', Icon: BarChart2 },
  { to: ROUTES.BUDGETS, label: 'Budgets', Icon: Target },
  { to: ROUTES.SETTINGS, label: 'Settings', Icon: Settings },
] as const

const PAGES_WITH_MONTH_PICKER = [
  ROUTES.DASHBOARD,
  ROUTES.TRANSACTIONS,
  ROUTES.ANALYTICS,
  ROUTES.BUDGETS,
]

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { pathname } = useLocation()
  const { activeMonth, setActiveMonth, toggleSidebar } = useUIStore()

  const showMonthPicker = PAGES_WITH_MONTH_PICKER.includes(pathname as (typeof PAGES_WITH_MONTH_PICKER)[number])

  const prevMonth = () =>
    setActiveMonth(format(subMonths(parseISO(`${activeMonth}-01`), 1), 'yyyy-MM'))
  const nextMonth = () =>
    setActiveMonth(format(addMonths(parseISO(`${activeMonth}-01`), 1), 'yyyy-MM'))
  const isCurrentMonth = activeMonth === format(new Date(), 'yyyy-MM')

  return (
    <>
      {/* Top bar — mobile only */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm lg:hidden">
        <button
          onClick={() => { onMenuClick(); toggleSidebar() }}
          aria-label="Open navigation menu"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>

        {showMonthPicker && (
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} aria-label="Previous month" className="rounded p-1 hover:bg-muted">
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <span className="min-w-[110px] text-center text-sm font-medium text-foreground">
              {formatMonth(activeMonth)}
            </span>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              disabled={isCurrentMonth}
              className="rounded p-1 hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Spacer to balance the layout */}
        <div className="w-8" aria-hidden="true" />
      </header>

      {/* Desktop month picker strip inside main area — rendered here for sticky top */}
      {showMonthPicker && (
        <div className="hidden lg:flex items-center gap-1 px-6 pt-5 pb-0">
          <button onClick={prevMonth} aria-label="Previous month" className="rounded p-1 hover:bg-muted">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="min-w-[130px] text-sm font-semibold text-foreground">
            {formatMonth(activeMonth)}
          </span>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            disabled={isCurrentMonth}
            className="rounded p-1 hover:bg-muted disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Bottom nav bar — mobile only */}
      <nav
        aria-label="Bottom navigation"
        className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur-sm lg:hidden"
      >
        <ul className="flex h-16 items-center" role="list">
          {BOTTOM_NAV.map(({ to, label, Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                aria-label={label}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-0.5 h-full w-full text-[10px] font-medium transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')}
                      aria-hidden="true"
                    />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
