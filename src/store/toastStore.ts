import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration: number
}

interface ToastState {
  toasts: ToastItem[]
  add: (message: string, type: ToastType, duration?: number) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  add: (message, type, duration = 3500) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message, type, duration }] }))
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// Convenience hook — mirrors the shadcn/ui useToast API shape
export function useToast() {
  const { add } = useToastStore()
  return {
    toast: {
      success: (message: string) => add(message, 'success'),
      error: (message: string) => add(message, 'error'),
      warning: (message: string) => add(message, 'warning'),
      info: (message: string) => add(message, 'info'),
    },
  }
}
