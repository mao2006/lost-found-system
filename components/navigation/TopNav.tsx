'use client'

import type { NavItem } from './types'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { Button, Flex, message, Modal, Typography } from 'antd'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import FeedbackModal from './FeedbackModal'

const { Title } = Typography

const NAV_ITEMS: NavItem[] = [
  { key: 'query', label: '查询信息', path: '/query' },
  { key: 'publish', label: '发布信息', path: '/publish' },
  { key: 'my-posts', label: '我的发布', path: '/my-posts' },
]

const ACTION_BUTTON_CLASSNAME = 'rounded-lg !h-11 !px-4 !text-base !font-medium !text-blue-600 transition-none hover:!bg-transparent hover:!text-blue-600 active:!bg-transparent'

function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const activeNav = useMemo(
    () => NAV_ITEMS.find(item => pathname.startsWith(item.path))?.key ?? null,
    [pathname],
  )

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
        gap={12}
        className="sticky top-0 z-20 border-b border-blue-100 bg-white/95 px-3 py-3 backdrop-blur sm:px-6 sm:py-4"
      >
        <Flex align="center" className="shrink-0" style={{ paddingInlineStart: 16 }}>
          <Title level={3} className="!mb-0 !text-blue-700">
            校园失物招领平台
          </Title>
        </Flex>

        <Flex
          align="center"
          justify="center"
          gap={6}
          className="min-w-0 flex-1 overflow-x-auto px-3 py-1"
        >
          {NAV_ITEMS.map(item => (
            <Button
              key={item.key}
              type={activeNav === item.key ? 'primary' : 'text'}
              size="large"
              onClick={() => router.push(item.path)}
              className="shrink-0 rounded-lg !h-10 !px-5 !text-base"
            >
              {item.label}
            </Button>
          ))}
        </Flex>

        <Flex align="center" gap={4} className="shrink-0">
          <Button
            type="text"
            size="large"
            onClick={() => setFeedbackOpen(true)}
            className={ACTION_BUTTON_CLASSNAME}
          >
            意见反馈
          </Button>
          <Button
            type="text"
            size="large"
            onClick={handleLogout}
            className={`${ACTION_BUTTON_CLASSNAME} !text-red-500 hover:!text-red-500`}
          >
            退出登录
          </Button>
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
