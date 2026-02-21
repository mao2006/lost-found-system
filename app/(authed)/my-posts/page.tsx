'use client'

import { Card, Flex, Typography } from 'antd'

const { Paragraph, Title } = Typography

function MyPostsPage() {
  return (
    <Flex vertical gap={12}>
      <Card
        className="rounded-lg border-blue-100"
        styles={{ body: { padding: 20 } }}
      >
        <Title level={3} className="!mb-2 !text-blue-700">
          我的发布
        </Title>
        <Paragraph className="!mb-0 !text-blue-900/80">
          该模块正在开发中，后续将提供我发布的信息管理、下架与更新操作能力。
        </Paragraph>
      </Card>
    </Flex>
  )
}

export default MyPostsPage
