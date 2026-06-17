import type { ReactNode } from 'react'
import { Footer } from '@/components/layout/footer'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background flex min-h-svh flex-col">
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <Footer />
    </div>
  )
}
