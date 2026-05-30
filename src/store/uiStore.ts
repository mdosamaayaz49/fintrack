import { create } from 'zustand'
import { currentMonthISO } from '@/utils/formatDate'

interface UIState {
  sidebarOpen: boolean
  /** Active month filter across pages, "YYYY-MM" */
  activeMonth: string
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setActiveMonth: (month: string) => void
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: false,
  activeMonth: currentMonthISO(),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveMonth: (month) => set({ activeMonth: month }),
}))
