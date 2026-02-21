'use client'

import type { NavItem } from './types'
import {
  ExclamationCircleFilled,
  HomeOutlined,
  InboxOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { Button, Flex, message, Modal, Tooltip } from 'antd'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import FeedbackModal from './FeedbackModal'

const NAV_ITEMS: NavItem[] = [
  { key: 'query', label: '查询信息', path: '/query' },
  { key: 'publish', label: '发布信息', path: '/publish' },
  { key: 'my-posts', label: '我的发布', path: '/my-posts' },
]

function TopNav(): JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const activeNav = useMemo(
    () => NAV_ITEMS.find(item => pathname.startsWith(item.path))?.key ?? null,
    [pathname],
  )

  const goHomepage = () => {
    router.push('/homepage')
  }

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出登录？',
      content: '当前为演示流程，确认后将返回登录页。',
      okText: '确认退出',
      cancelText: '取消',
      okType: 'danger',
      icon: <ExclamationCircleFilled />,
      onOk: () => {
        message.success('已退出登录（演示）')
        router.push('/login')
      },
    })
  }

  return (
    <>
      <Flex
        align="center"
        justify="space-between"
        gap={8}
        className="sticky top-0 z-20 border-b border-blue-100 bg-white/95 px-2 py-2 backdrop-blur sm:px-4"
      >
        <Button
          type="text"
          shape="circle"
          size="large"
          aria-label="返回主页"
          icon={<HomeOutlined />}
          onClick={goHomepage}
          className="!text-blue-600"
        />

        <Flex
          align="center"
          gap={4}
          className="min-w-0 flex-1 overflow-x-auto px-1"
        >
          {NAV_ITEMS.map(item => (
            <Button
              key={item.key}
              type={activeNav === item.key ? 'primary' : 'text'}
              onClick={() => router.push(item.path)}
              className="shrink-0 rounded-lg"
            >
              {item.label}
            </Button>
          ))}
        </Flex>

        <Flex align="center" gap={2}>
          <Tooltip title="意见反馈">
            <Button
              type="text"
              shape="circle"
              size="large"
              aria-label="意见反馈"
              icon={<InboxOutlined />}
              onClick={() => setFeedbackOpen(true)}
              className="!text-blue-600"
            />
          </Tooltip>
          <Tooltip title="退出登录">
            <Button
              type="text"
              shape="circle"
              size="large"
              aria-label="退出登录"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="!text-blue-600"
            />
          </Tooltip>
        </Flex>
      </Flex>

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </>
  )
}

export default TopNav
