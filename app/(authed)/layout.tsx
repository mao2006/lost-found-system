'use client'

import type { ReactNode } from 'react'
import { Flex } from 'antd'
import TopNav from '@/components/navigation/TopNav'

function AuthedLayout({ children }: { children: ReactNode }) {
  return (
    <Flex vertical className="min-h-[100dvh] bg-blue-50">
      <TopNav />
      <main className="w-full px-3 py-3 sm:px-5 sm:py-4">
        {children}
      </main>
    </Flex>
  )
}

export default AuthedLayout
