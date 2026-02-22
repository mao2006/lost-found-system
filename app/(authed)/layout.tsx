'use client'

import type { ReactNode } from 'react'
import { Flex } from 'antd'
import TopNav from '@/components/navigation/TopNav'

function AuthedLayout({ children }: { children: ReactNode }) {
  return (
    <Flex vertical className="h-[100dvh] overflow-hidden bg-blue-50">
      <TopNav />
      <main className="min-h-0 w-full flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
        {children}
      </main>
    </Flex>
  )
}

export default AuthedLayout
