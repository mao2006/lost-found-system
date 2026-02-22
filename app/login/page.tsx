'use client'

import { animate } from 'animejs'
import { Button, Card, Flex, Form, Input, message, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

const { Text, Title } = Typography

function LoginPage() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const formItemStyle = { marginBottom: 12 }
  const router = useRouter()

  useEffect(() => {
    const root = rootRef.current
    if (!root)
      return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (prefersReduced.matches)
      return

    const animations = [
      animate(root.querySelectorAll('[data-animate="rise"]'), {
        opacity: [0, 1],
        translateY: [24, 0],
        duration: 900,
        delay: 240,
        ease: 'outExpo',
      }),
    ]

    return () => {
      animations.forEach(animation => animation.cancel())
    }
  }, [])

  const handleLoginSuccess = () => {
    message.success({
      content: '登录成功，正在进入系统',
      duration: 1,
      onClose: () => router.push('/query'),
    })
  }

  return (
    <div
      ref={rootRef}
      className="relative h-[100dvh] overflow-hidden overscroll-none bg-zinc-50 text-zinc-900"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute right-[-20%] top-[-10%] h-80 w-80 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute bottom-[-18%] left-1/3 h-96 w-96 rounded-full bg-blue-300/20 blur-[120px]" />
      </div>

      <Flex
        component="main"
        align="center"
        justify="center"
        className="relative z-10 h-full px-4 sm:px-6"
      >
        <Card
          styles={{ body: { padding: 24 } }}
          className="md:w-[450px] w-[300px] overflow-hidden rounded-xl border border-zinc-200/80 bg-white/95 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.25)] backdrop-blur"
        >
          <Flex
            component="section"
            vertical
            gap={18}
            className="bg-white"
          >
            <Flex vertical gap="5px">
              <Text
                data-animate="rise"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500"
              >
                Welcome Back
              </Text>
              <Title
                level={2}
                data-animate="rise"
                className="!mb-0 !text-2xl !font-semibold !text-zinc-900"
              >
                校园失物招领平台
              </Title>
            </Flex>

            <Form
              data-animate="rise"
              layout="vertical"
              requiredMark={false}
              colon={false}
              onFinish={handleLoginSuccess}
            >
              <Form.Item
                label="账号"
                name="account"
                style={formItemStyle}
              >
                <Input
                  size="large"
                  placeholder="学号 / 工号"
                  autoComplete="username"
                />
              </Form.Item>
              <Form.Item
                label="密码"
                name="password"
                style={formItemStyle}
              >
                <Input.Password
                  size="large"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </Form.Item>
              <Flex className="pt-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  className="h-12"
                >
                  登录
                </Button>
              </Flex>
            </Form>
          </Flex>
        </Card>
      </Flex>
    </div>
  )
}

export default LoginPage
