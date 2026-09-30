'use client'

import { BottomNav } from '@/components/BottomNav'

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell pb-24 pt-5">
      {children}
      <BottomNav />
    </div>
  )
}
