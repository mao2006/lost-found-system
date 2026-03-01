'use client'

import type { BubbleItemType, ConversationItemType } from '@ant-design/x'
import type { ComponentRef } from 'react'
import type { AgentStreamEvent } from '@/api/modules/agent'
import { PlusOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'
import { Bubble, Conversations, Sender, Welcome } from '@ant-design/x'
import { useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Card, Flex, message, Spin, Typography } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { streamAgentMessage } from '@/api/modules/agent'
import { queryKeys } from '@/api/queryKeys'
import {
  useAgentHistoryQuery,
  useAgentSessionsQuery,
  useCreateAgentSessionMutation,
} from '@/hooks/queries/useAgentQueries'

const { Text } = Typography
const TOOL_RESULT_MAX_LENGTH = 180

function toDisplayText(value: string, fallback: string) {
  const normalized = value.trim()
  return normalized || fallback
}

function toSessionTimeLabel(value: string) {
  const normalized = value.trim()
  return normalized || '刚刚更新'
}

function toToolResultSummary(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized)
    return ''

  if (normalized.length <= TOOL_RESULT_MAX_LENGTH)
    return normalized

  return `${normalized.slice(0, TOOL_RESULT_MAX_LENGTH)}...`
}

function createBubbleKey(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createSystemBubbleItem(content: string): BubbleItemType {
  return {
    key: createBubbleKey('system'),
    role: 'system',
    content,
  }
}

function AgentPageClient() {
  const queryClient = useQueryClient()
  const bubbleListRef = useRef<ComponentRef<typeof Bubble.List> | null>(null)
  const streamAbortRef = useRef<AbortController | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [senderValue, setSenderValue] = useState('')
  const [bubbleItems, setBubbleItems] = useState<BubbleItemType[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const sessionsQuery = useAgentSessionsQuery()
  const resolvedActiveSessionId = selectedSessionId || sessionsQuery.data?.[0]?.session_id || ''
  const historyQuery = useAgentHistoryQuery(
    resolvedActiveSessionId,
    !!resolvedActiveSessionId,
  )
  const createSessionMutation = useCreateAgentSessionMutation()

  const roleConfig = useMemo(
    () => ({
      ai: {
        placement: 'start' as const,
        variant: 'shadow' as const,
        shape: 'default' as const,
        avatar: <Avatar size={28} icon={<RobotOutlined />} className="!bg-blue-600" />,
      },
      user: {
        placement: 'end' as const,
        variant: 'filled' as const,
        shape: 'default' as const,
        avatar: <Avatar size={28} icon={<UserOutlined />} className="!bg-blue-400" />,
      },
      system: {
        variant: 'borderless' as const,
      },
    }),
    [],
  )

  const conversationItems = useMemo<ConversationItemType[]>(
    () =>
      (sessionsQuery.data || []).map((session, index) => {
        const title = toDisplayText(session.title, `会话 ${index + 1}`)
        const timeLabel = toSessionTimeLabel(session.updated_at || session.created_at)

        return {
          key: session.session_id,
          label: (
            <Flex vertical gap={2} className="min-w-0">
              <Text
                className="!text-blue-900"
                ellipsis={{ tooltip: title }}
              >
                {title}
              </Text>
              <Text className="!text-xs !text-blue-900/55">
                {timeLabel}
              </Text>
            </Flex>
          ),
        }
      }),
    [sessionsQuery.data],
  )

  const historyBubbleItems = useMemo<BubbleItemType[]>(
    () =>
      (historyQuery.data || []).map(record => ({
        key: createBubbleKey('history'),
        role: record.role === 'user' ? 'user' : 'ai',
        content: record.content,
      })),
    [historyQuery.data],
  )

  const displayBubbleItems = useMemo(
    () => (bubbleItems.length ? bubbleItems : historyBubbleItems),
    [bubbleItems, historyBubbleItems],
  )

  useEffect(
    () => () => {
      streamAbortRef.current?.abort()
    },
    [],
  )

  useEffect(() => {
    if (!displayBubbleItems.length)
      return

    const frameId = window.requestAnimationFrame(() => {
      const bubbleList = bubbleListRef.current
      if (!bubbleList?.scrollBoxNativeElement)
        return

      bubbleList.scrollTo({ top: 'bottom', behavior: 'smooth' })
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [displayBubbleItems])

  const handleCreateSession = async () => {
    if (isStreaming) {
      message.warning('当前回复进行中，请稍后再新建会话')
      return
    }

    try {
      const sessionId = await createSessionMutation.mutateAsync({})
      setSelectedSessionId(sessionId)
      setSenderValue('')
      setBubbleItems([])
    }
    catch (error) {
      message.error(error instanceof Error ? error.message : '新建会话失败，请稍后重试')
    }
  }

  const handleSessionChange = (sessionId: string | number) => {
    if (isStreaming) {
      message.warning('当前回复进行中，请稍后再切换会话')
      return
    }

    setSenderValue('')
    setBubbleItems([])
    setSelectedSessionId(String(sessionId))
  }

  const handleSubmit = async (inputValue: string) => {
    const normalizedMessage = inputValue.trim()
    if (!normalizedMessage || isStreaming)
      return

    setSenderValue('')
    let nextSessionId = resolvedActiveSessionId
    let assistantKey = ''
    let assistantContent = ''

    try {
      if (!nextSessionId) {
        nextSessionId = await createSessionMutation.mutateAsync({
          title: normalizedMessage.slice(0, 20),
        })
        setSelectedSessionId(nextSessionId)
        setBubbleItems([])
      }

      assistantKey = createBubbleKey('assistant')
      const userKey = createBubbleKey('user')

      setBubbleItems((prev) => {
        const baseItems = prev.length ? prev : historyBubbleItems

        return [
          ...baseItems,
          {
            key: userKey,
            role: 'user',
            content: normalizedMessage,
          },
          {
            key: assistantKey,
            role: 'ai',
            content: '',
            loading: true,
          },
        ]
      })

      setIsStreaming(true)
      const abortController = new AbortController()
      streamAbortRef.current = abortController

      await streamAgentMessage(
        {
          session_id: nextSessionId,
          message: normalizedMessage,
          images: [],
        },
        {
          onEvent: (event: AgentStreamEvent) => {
            if (event.type === 'content') {
              assistantContent += event.content
              setBubbleItems((prev) => {
                return prev.map((item) => {
                  if (item.key !== assistantKey)
                    return item

                  return {
                    ...item,
                    content: assistantContent,
                    loading: false,
                    streaming: true,
                  }
                })
              })
              return
            }

            if (event.type === 'tool_call') {
              const toolName = toDisplayText(event.data.name, '工具')
              const argumentsText = event.data.arguments.trim()
              const content = argumentsText
                ? `正在调用工具：${toolName}\n参数：${argumentsText}`
                : `正在调用工具：${toolName}`
              setBubbleItems(prev => [...prev, createSystemBubbleItem(content)])
              return
            }

            const toolName = toDisplayText(
              event.data.tool_name || event.data.tool_call_id,
              '工具',
            )
            const resultText = toToolResultSummary(event.data.result)
            setBubbleItems(prev => [
              ...prev,
              createSystemBubbleItem(
                resultText
                  ? `${toolName} 返回：${resultText}`
                  : `${toolName} 已返回结果`,
              ),
            ])
          },
        },
        abortController.signal,
      )

      setBubbleItems((prev) => {
        return prev.map((item) => {
          if (item.key !== assistantKey)
            return item

          return {
            ...item,
            content: assistantContent || '已收到你的问题，暂时没有生成可展示内容。',
            loading: false,
            streaming: false,
          }
        })
      })

      void queryClient.invalidateQueries({ queryKey: queryKeys.agent.sessions() })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.agent.history({ session_id: nextSessionId }),
      })
    }
    catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        message.error(error instanceof Error ? error.message : '发送失败，请稍后重试')
      }

      if (assistantKey) {
        setBubbleItems((prev) => {
          return prev.map((item) => {
            if (item.key !== assistantKey)
              return item

            return {
              ...item,
              content: assistantContent || '请求失败，请稍后重试。',
              loading: false,
              streaming: false,
            }
          })
        })
      }
    }
    finally {
      streamAbortRef.current = null
      setIsStreaming(false)
    }
  }

  return (
    <Flex className="mx-auto w-full max-w-[1820px] items-center justify-center lg:min-h-[calc(100dvh-108px)]">
      <Flex
        gap={12}
        className="w-full flex-col lg:h-[calc(100dvh-108px)] lg:min-h-[700px] lg:flex-row lg:items-stretch"
      >
        <Card
          className="w-full rounded-lg border-blue-100 lg:h-full lg:w-[320px] lg:shrink-0"
          styles={{ body: { padding: 12, height: '100%' } }}
        >
          <Flex vertical gap={10} className="h-full">
            <div className="min-h-0 flex-1 overflow-y-auto">
              {sessionsQuery.isLoading
                ? (
                    <Flex align="center" justify="center" className="h-full py-8">
                      <Spin size="small" />
                    </Flex>
                  )
                : (
                    <Conversations
                      items={conversationItems}
                      activeKey={resolvedActiveSessionId || undefined}
                      onActiveChange={handleSessionChange}
                      creation={{
                        icon: <PlusOutlined />,
                        label: '新建会话',
                        onClick: () => {
                          void handleCreateSession()
                        },
                        disabled: createSessionMutation.isPending || isStreaming,
                      }}
                      className="rounded-lg"
                    />
                  )}
            </div>

            {sessionsQuery.isError && (
              <Flex vertical gap={8}>
                <Text className="!text-xs !text-red-500">
                  {sessionsQuery.error instanceof Error
                    ? sessionsQuery.error.message
                    : '获取会话失败，请稍后重试'}
                </Text>
                <Button
                  size="small"
                  onClick={() => {
                    void sessionsQuery.refetch()
                  }}
                >
                  重试
                </Button>
              </Flex>
            )}
          </Flex>
        </Card>

        <Card
          className="w-full rounded-lg border-blue-100 lg:h-full lg:min-w-0 lg:flex-1"
          styles={{ body: { padding: 12, height: '100%' } }}
        >
          <Flex vertical gap={10} className="h-[74dvh] min-h-[540px] lg:h-full">
            <div className="min-h-0 flex-1 overflow-hidden rounded-lg bg-blue-50/70 p-2">
              {historyQuery.isLoading && resolvedActiveSessionId
                ? (
                    <Flex align="center" justify="center" className="h-full">
                      <Spin />
                    </Flex>
                  )
                : historyQuery.isError
                  ? (
                      <Flex vertical gap={8} align="center" justify="center" className="h-full">
                        <Text className="!text-red-500">
                          {historyQuery.error instanceof Error
                            ? historyQuery.error.message
                            : '加载历史消息失败'}
                        </Text>
                        <Button
                          onClick={() => {
                            void historyQuery.refetch()
                          }}
                        >
                          重试
                        </Button>
                      </Flex>
                    )
                  : displayBubbleItems.length
                    ? (
                        <Bubble.List
                          ref={bubbleListRef}
                          items={displayBubbleItems}
                          role={roleConfig}
                          className="h-full"
                          styles={{ scroll: { paddingInlineEnd: 4, paddingBlock: 6 } }}
                        />
                      )
                    : (
                        <Welcome
                          variant="borderless"
                          icon={<Avatar icon={<RobotOutlined />} className="!bg-blue-600" />}
                          title={resolvedActiveSessionId ? '开始继续对话' : '新建会话并开始提问'}
                          description="例如：帮我整理一条失物招领信息；或查询黑色水杯相关记录。"
                        />
                      )}
            </div>

            <Sender
              value={senderValue}
              onChange={value => setSenderValue(value)}
              onSubmit={(value) => {
                void handleSubmit(value)
              }}
              loading={isStreaming}
              onCancel={() => streamAbortRef.current?.abort()}
              disabled={createSessionMutation.isPending || historyQuery.isLoading}
              placeholder="输入问题并回车发送"
              className="rounded-lg border border-blue-100 bg-white"
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          </Flex>
        </Card>
      </Flex>
    </Flex>
  )
}

export default AgentPageClient
