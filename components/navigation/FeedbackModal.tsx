'use client'

import type { FeedbackRecord } from './types'
import { Button, Empty, Flex, Input, List, message, Modal, Tabs, Tag } from 'antd'
import { useState } from 'react'

const { TextArea } = Input

const MOCK_HISTORY: FeedbackRecord[] = [
  {
    id: 'F-20260115-01',
    content: '希望查询页可以增加按时间筛选，查找效率会更高。',
    createdAt: '2026-01-15 10:20',
    status: '处理中',
  },
  {
    id: 'F-20260110-02',
    content: '发布信息时建议支持上传多张图片。',
    createdAt: '2026-01-10 16:42',
    status: '已处理',
  },
  {
    id: 'F-20260106-03',
    content: '移动端顶部按钮区域建议再加大点击范围。',
    createdAt: '2026-01-06 09:08',
    status: '已处理',
  },
]

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
}

function FeedbackModal({ open, onClose }: FeedbackModalProps): JSX.Element {
  const [activeKey, setActiveKey] = useState('submit')
  const [feedbackContent, setFeedbackContent] = useState('')

  const resetState = () => {
    setActiveKey('submit')
    setFeedbackContent('')
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleSubmit = () => {
    const trimmed = feedbackContent.trim()
    if (!trimmed) {
      message.warning('请输入反馈内容')
      return
    }

    message.success('反馈已提交（演示）')
    setFeedbackContent('')
    setActiveKey('history')
  }

  const historyNode = (
    <div className="rounded-lg bg-blue-50 p-2">
      {MOCK_HISTORY.length
        ? (
            <List
              dataSource={MOCK_HISTORY}
              renderItem={record => (
                <List.Item className="!px-3 !py-3">
                  <Flex vertical gap={8} className="w-full">
                    <Flex align="center" justify="space-between" gap={10}>
                      <span className="text-xs text-blue-900/60">{record.id}</span>
                      <Tag color={record.status === '已处理' ? 'blue' : 'processing'}>
                        {record.status}
                      </Tag>
                    </Flex>
                    <p className="text-sm text-blue-900">{record.content}</p>
                    <span className="text-xs text-blue-900/60">{record.createdAt}</span>
                  </Flex>
                </List.Item>
              )}
            />
          )
        : (
            <Empty description="暂无历史反馈" />
          )}
    </div>
  )

  return (
    <Modal
      title="意见反馈"
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden
      width={640}
    >
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        items={[
          {
            key: 'submit',
            label: '提交反馈',
            children: (
              <Flex vertical gap={10}>
                <TextArea
                  value={feedbackContent}
                  onChange={event => setFeedbackContent(event.target.value)}
                  placeholder="请填写你对系统的意见和建议"
                  autoSize={{ minRows: 4, maxRows: 8 }}
                  maxLength={300}
                />
                <Flex justify="end">
                  <span className="text-xs text-blue-900/50">
                    {`${feedbackContent.length} / 300`}
                  </span>
                </Flex>
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  className="rounded-lg"
                >
                  提交反馈
                </Button>
              </Flex>
            ),
          },
          {
            key: 'history',
            label: '历史记录',
            children: historyNode,
          },
        ]}
      />
    </Modal>
  )
}

export default FeedbackModal
