'use client'
import { create } from 'zustand'
import { useEffect } from 'react'

type ToastType = 'success' | 'error'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastStore {
  toasts: ToastItem[]
  show: (message: string, type?: ToastType) => void
  remove: (id: number) => void
}

let nextId = 0
export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  show: (message, type = 'success') => {
    const id = ++nextId
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function toast(message: string, type: ToastType = 'success') {
  useToastStore.getState().show(message, type)
}

export default function ToastContainer() {
  const { toasts, remove } = useToastStore()
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${t.type === 'success' ? 'bg-forest' : 'bg-terracotta'}`}
        >
          <span>{t.message}</span>
          <button onClick={() => remove(t.id)} className="ml-2 text-white/70 hover:text-white">✕</button>
        </div>
      ))}
    </div>
  )
}
