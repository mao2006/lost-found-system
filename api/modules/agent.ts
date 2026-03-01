import { request } from '@/api/request'
import { ApiRequestError } from '@/api/types'

interface CreateAgentSessionData {
  session_id?: unknown
}

interface AgentSessionsData {
  sessions?: unknown
}

interface AgentHistoryData {
  messages?: unknown
}

export interface AgentSession {
  session_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface AgentHistoryMessage {
  role: 'user' | 'assistant'
  content: string
  images: string[]
  created_at: string
}

export interface AgentHistoryParams {
  session_id: string
}

export interface CreateAgentSessionPayload {
  title?: string
}

export interface AgentStreamPayload {
  session_id: string
  message: string
  images?: string[]
}

export interface AgentToolCallEventData {
  id: string
  name: string
  arguments: string
}

export interface AgentToolResultEventData {
  tool_call_id: string
  tool_name: string
  result: string
}

export type AgentStreamEvent = {
  type: 'content'
  content: string
} | {
  type: 'tool_call'
  data: AgentToolCallEventData
} | {
  type: 'tool_result'
  data: AgentToolResultEventData
}

interface AgentStreamCallbacks {
  onEvent: (event: AgentStreamEvent) => void
  onDone?: () => void
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toText(value: unknown) {
  if (typeof value !== 'string')
    return ''

  return value.trim()
}

function toTextArray(value: unknown) {
  if (!Array.isArray(value))
    return []

  return value
    .map(item => toText(item))
    .filter(Boolean)
}

function toOptionalText(value: unknown) {
  const text = toText(value)
  return text || undefined
}

function toAgentSession(value: unknown): AgentSession | null {
  if (!isObject(value))
    return null

  const sessionId = toText(value.session_id)
  if (!sessionId)
    return null

  return {
    session_id: sessionId,
    title: toText(value.title),
    created_at: toText(value.created_at),
    updated_at: toText(value.updated_at),
  }
}

function toAgentHistoryMessage(value: unknown): AgentHistoryMessage | null {
  if (!isObject(value))
    return null

  const role = toText(value.role) === 'user' ? 'user' : 'assistant'
  const content = toText(value.content)
  const createdAt = toText(value.created_at)

  if (!content)
    return null

  return {
    role,
    content,
    images: toTextArray(value.images),
    created_at: createdAt,
  }
}

function toAgentStreamEvent(raw: string): AgentStreamEvent | null {
  try {
    const parsed = JSON.parse(raw)
    if (!isObject(parsed))
      return null

    const type = toText(parsed.type)
    if (type === 'content') {
      return {
        type: 'content',
        content: typeof parsed.content === 'string' ? parsed.content : '',
      }
    }

    if (type === 'tool_call') {
      const data = isObject(parsed.data) ? parsed.data : {}
      return {
        type: 'tool_call',
        data: {
          id: toText(data.id),
          name: toText(data.name),
          arguments: toText(data.arguments),
        },
      }
    }

    if (type === 'tool_result') {
      const data = isObject(parsed.data) ? parsed.data : {}
      return {
        type: 'tool_result',
        data: {
          tool_call_id: toText(data.tool_call_id),
          tool_name: toText(data.tool_name),
          result: toText(data.result),
        },
      }
    }
  }
  catch {
    return null
  }

  return null
}

async function resolveStreamError(response: Response) {
  const status = response.status
  const fallbackMessage = status ? `请求失败（${status}）` : '请求失败'

  try {
    const payload = await response.json()
    if (!isObject(payload))
      return new ApiRequestError(fallbackMessage, { status })

    const message = toOptionalText(payload.message) || fallbackMessage
    const code = typeof payload.code === 'number' ? payload.code : undefined
    return new ApiRequestError(message, { code, status })
  }
  catch {
    return new ApiRequestError(fallbackMessage, { status })
  }
}

export async function createAgentSession(payload: CreateAgentSessionPayload = {}) {
  const title = toOptionalText(payload.title)

  const data = await request<CreateAgentSessionData>({
    url: '/agent/session',
    method: 'POST',
    data: title ? { title } : {},
  })

  const sessionId = toText(data.session_id)
  if (!sessionId)
    throw new ApiRequestError('创建会话失败：未返回会话 ID')

  return sessionId
}

export async function getAgentSessions() {
  const data = await request<AgentSessionsData>({
    url: '/agent/sessions',
    method: 'GET',
  })

  const list = Array.isArray(data.sessions) ? data.sessions : []
  return list
    .map(toAgentSession)
    .filter((item): item is AgentSession => item !== null)
}

export async function getAgentHistory(sessionId: string) {
  const normalizedSessionId = toText(sessionId)
  if (!normalizedSessionId)
    throw new ApiRequestError('sessionId 不能为空')

  const data = await request<AgentHistoryData>({
    url: '/agent/history',
    method: 'GET',
    params: { session_id: normalizedSessionId },
  })

  const list = Array.isArray(data.messages) ? data.messages : []
  return list
    .map(toAgentHistoryMessage)
    .filter((item): item is AgentHistoryMessage => item !== null)
}

export async function streamAgentMessage(
  payload: AgentStreamPayload,
  callbacks: AgentStreamCallbacks,
  signal?: AbortSignal,
) {
  const sessionId = toText(payload.session_id)
  const content = toText(payload.message)

  if (!sessionId)
    throw new ApiRequestError('sessionId 不能为空')
  if (!content)
    throw new ApiRequestError('消息不能为空')

  const response = await fetch('/api/agent/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      session_id: sessionId,
      message: content,
      images: toTextArray(payload.images),
    }),
    signal,
  })

  const contentType = response.headers.get('content-type') || ''
  if (!response.ok || contentType.includes('application/json'))
    throw await resolveStreamError(response)

  if (!response.body)
    throw new ApiRequestError('流式响应不可用', { status: response.status })

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done)
      break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data:'))
        continue

      const data = line.slice(5).trimStart()
      if (!data)
        continue

      if (data === '[DONE]') {
        callbacks.onDone?.()
        return
      }

      const event = toAgentStreamEvent(data)
      if (event)
        callbacks.onEvent(event)
    }
  }

  const tail = `${buffer}${decoder.decode()}`.trim()
  if (tail.startsWith('data:')) {
    const data = tail.slice(5).trimStart()
    if (data === '[DONE]') {
      callbacks.onDone?.()
      return
    }

    const event = toAgentStreamEvent(data)
    if (event)
      callbacks.onEvent(event)
  }

  callbacks.onDone?.()
}
