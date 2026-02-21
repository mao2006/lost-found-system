'use client'

import { Card, Flex, Typography } from 'antd'

const { Paragraph, Title } = Typography

function Homepage() {
  return (
    <Flex vertical gap={12}>
      <Card
        className="rounded-lg border-blue-100"
        styles={{ body: { padding: 20 } }}
      >
        <Title level={3} className="!mb-2 !text-blue-700">
          系统主页
        </Title>
        <Paragraph className="!mb-0 !text-blue-900/80">
          欢迎进入校园失物招领系统。你可以通过顶部导航进入查询信息、发布信息和我的发布页面。
        </Paragraph>
      </Card>
    </Flex>
  )
}

export default Homepage
