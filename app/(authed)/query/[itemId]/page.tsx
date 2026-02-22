import { MOCK_LOST_FOUND_ITEMS } from '@/components/query/constants'
import QueryDetailPageClient from '@/components/query/QueryDetailPageClient'

interface QueryDetailPageProps {
  params: Promise<{
    itemId: string
  }>
}

export function generateStaticParams() {
  return MOCK_LOST_FOUND_ITEMS.map(item => ({ itemId: item.id }))
}

async function QueryDetailPage({ params }: QueryDetailPageProps) {
  const { itemId } = await params
  return <QueryDetailPageClient itemId={itemId} />
}

export default QueryDetailPage
