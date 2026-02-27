import type { FeedbackRecord, SubmitFeedbackPayload } from '@/components/query/types'
import { request } from '@/api/request'

export interface FeedbackListParams {
  processed?: boolean
  page?: number
  page_size?: number
}

interface FeedbackListItem {
  created_at: string
  description: string
  id: number
  post_id: number
  processed: boolean
  type: string
  type_other: string
}

interface FeedbackListData {
  list: FeedbackListItem[]
  page: number
  page_size: number
  total: number
}

interface SubmitFeedbackRequestPayload {
  post_id: number
  type: string
  type_other: string
  description: string
}

interface SubmitFeedbackResponseData {
  feedback_id: number
}

const PRESET_FEEDBACK_TYPES = new Set([
  '信息不全',
  '不实消息',
  '恶心血腥',
  '涉黄信息',
])

function mapFeedbackItemToRecord(item: FeedbackListItem): FeedbackRecord {
  const mergedType = item.type === '其它类型' && item.type_other
    ? item.type_other
    : item.type

  return {
    id: String(item.id),
    types: mergedType ? [mergedType] : [],
    description: item.description || '',
    createdAt: item.created_at,
    status: item.processed ? '已处理' : '待审核',
    source: '反馈页',
  }
}

function resolveSubmitTypePayload(type: string) {
  const normalized = type.trim()
  if (PRESET_FEEDBACK_TYPES.has(normalized)) {
    return {
      type: normalized,
      type_other: '',
    }
  }

  return {
    type: '其它类型',
    type_other: normalized,
  }
}

function resolvePostId(postId?: string | number) {
  if (postId === undefined || postId === null)
    return 0

  const numericId = Number(postId)
  if (!Number.isFinite(numericId) || numericId < 0)
    return 0

  return numericId
}

export function getFeedbackRecords(params: FeedbackListParams = {}) {
  const page = Math.max(1, Math.trunc(params.page || 1))
  const pageSize = Math.min(50, Math.max(1, Math.trunc(params.page_size || 10)))

  return request<FeedbackListData>({
    url: '/feedback/my-list',
    method: 'GET',
    params: {
      ...params,
      page,
      page_size: pageSize,
    },
  }).then(result => result.list.map(mapFeedbackItemToRecord))
}

export async function submitFeedbackRequest(payload: SubmitFeedbackPayload) {
  const types = payload.types.map(type => type.trim()).filter(Boolean)
  if (!types.length)
    return []

  const postId = resolvePostId(payload.postId)
  const description = payload.description.trim()

  const requestPayloads: SubmitFeedbackRequestPayload[] = types.map((type) => {
    const resolvedType = resolveSubmitTypePayload(type)
    return {
      post_id: postId,
      type: resolvedType.type,
      type_other: resolvedType.type_other,
      description,
    }
  })

  const results = await Promise.all(
    requestPayloads.map(data =>
      request<SubmitFeedbackResponseData>({
        url: '/feedback/submit',
        method: 'POST',
        data,
      }),
    ),
  )

  return results.map(result => result.feedback_id)
}
