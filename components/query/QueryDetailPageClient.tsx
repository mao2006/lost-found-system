'use client'

import { Button, Card, Flex, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLostFoundStore } from '@/stores/lostFoundStore'
import ClaimRequestModal from './ClaimRequestModal'
import ComplaintModal from './ComplaintModal'
import ItemDetailCard from './ItemDetailCard'

const { Paragraph, Title } = Typography

interface QueryDetailPageClientProps {
  itemId: string
}

function QueryDetailPageClient({ itemId }: QueryDetailPageClientProps) {
  const router = useRouter()
  const [claimOpen, setClaimOpen] = useState(false)
  const [complaintOpen, setComplaintOpen] = useState(false)

  const item = useLostFoundStore(
    state => state.items.find(candidate => candidate.id === itemId),
  )

  const goBack = () => {
    if (window.history.length <= 1) {
      router.push('/query')
      return
    }

    router.back()
  }

  if (!item) {
    return (
      <Flex align="center" className="w-full">
        <Card
          className="w-full max-w-5xl rounded-lg border-blue-100"
          styles={{ body: { padding: 20 } }}
        >
          <Flex vertical gap={12}>
            <Title level={4} className="!mb-0 !text-blue-700">
              未找到该物品信息
            </Title>
            <Paragraph className="!mb-0 !text-blue-900/70">
              当前物品可能已下架或编号不存在，请返回查询页重新筛选。
            </Paragraph>
            <Flex>
              <Button type="primary" className="rounded-lg" onClick={() => router.push('/query')}>
                返回查询页
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    )
  }

  return (
    <>
      <Flex vertical gap={12} align="center" className="w-full">
        <ItemDetailCard item={item} onBack={goBack} />

        <Card
          className="w-full max-w-5xl rounded-lg border-blue-100"
          styles={{ body: { padding: 12 } }}
        >
          <Flex justify="center" gap={12} wrap>
            <Button
              size="large"
              onClick={() => setComplaintOpen(true)}
              className="h-11 min-w-32 rounded-lg px-6 text-base"
            >
              投诉与反馈
            </Button>
            <Button
              type="primary"
              size="large"
              className="h-11 min-w-32 rounded-lg px-6 text-base"
              onClick={() => setClaimOpen(true)}
            >
              认领申请
            </Button>
          </Flex>
        </Card>
      </Flex>

      <ClaimRequestModal
        open={claimOpen}
        item={item}
        onClose={() => setClaimOpen(false)}
      />
      <ComplaintModal
        open={complaintOpen}
        onClose={() => setComplaintOpen(false)}
      />
    </>
  )
}

export default QueryDetailPageClient
