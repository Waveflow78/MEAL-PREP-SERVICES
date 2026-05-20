'use client'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import ToastContainer from '@/components/ui/Toast'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ToastContainer />
    </SessionProvider>
  )
}
