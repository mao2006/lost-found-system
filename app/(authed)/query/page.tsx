import { Suspense } from 'react'
import QueryPageClient from '@/components/query/QueryPageClient'

function QueryPageFallback() {
  return <div className="w-full" />
}

function QueryPage() {
  return (
    <Suspense fallback={<QueryPageFallback />}>
      <QueryPageClient />
    </Suspense>
  )
}

export default QueryPage
