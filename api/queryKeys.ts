import type { AgentHistoryParams } from '@/api/modules/agent'
import type { AnnouncementListParams } from '@/api/modules/announcement'
import type { FeedbackListParams } from '@/api/modules/feedback'
import type { LostFoundListParams, MyPostListParams } from '@/api/modules/lostFound'

function removeEmptyFields<T extends object>(params: T): T {
  return Object.fromEntries(
    Object.entries(params as Record<string, unknown>).filter(([, value]) =>
      value !== undefined && value !== null && value !== '',
    ),
  ) as T
}

const LOST_FOUND_ROOT_KEY = ['lostFound'] as const
const FEEDBACK_ROOT_KEY = ['feedback'] as const
const POST_ROOT_KEY = ['post'] as const
const CLAIM_ROOT_KEY = ['claim'] as const
const PUBLIC_ROOT_KEY = ['public'] as const
const ANNOUNCEMENT_ROOT_KEY = ['announcement'] as const
const AGENT_ROOT_KEY = ['agent'] as const

export const queryKeys = {
  lostFound: {
    all: LOST_FOUND_ROOT_KEY,
    lists: () => [...LOST_FOUND_ROOT_KEY, 'list'] as const,
    list: (params: LostFoundListParams = {}) =>
      [...LOST_FOUND_ROOT_KEY, 'list', removeEmptyFields(params)] as const,
    details: () => [...LOST_FOUND_ROOT_KEY, 'detail'] as const,
    detail: (itemId: string) => [...LOST_FOUND_ROOT_KEY, 'detail', itemId] as const,
  },
  feedback: {
    all: FEEDBACK_ROOT_KEY,
    list: (params: FeedbackListParams = {}) =>
      [...FEEDBACK_ROOT_KEY, 'list', removeEmptyFields(params)] as const,
  },
  claim: {
    all: CLAIM_ROOT_KEY,
    lists: () => [...CLAIM_ROOT_KEY, 'list'] as const,
    list: (postId: string) => [...CLAIM_ROOT_KEY, 'list', postId] as const,
  },
  public: {
    all: PUBLIC_ROOT_KEY,
    config: () => [...PUBLIC_ROOT_KEY, 'config'] as const,
  },
  announcement: {
    all: ANNOUNCEMENT_ROOT_KEY,
    lists: () => [...ANNOUNCEMENT_ROOT_KEY, 'list'] as const,
    list: (params: AnnouncementListParams = {}) =>
      [...ANNOUNCEMENT_ROOT_KEY, 'list', removeEmptyFields(params)] as const,
  },
  agent: {
    all: AGENT_ROOT_KEY,
    sessions: () => [...AGENT_ROOT_KEY, 'sessions'] as const,
    history: (params: AgentHistoryParams) =>
      [...AGENT_ROOT_KEY, 'history', removeEmptyFields(params)] as const,
  },
  post: {
    all: POST_ROOT_KEY,
    myLists: () => [...POST_ROOT_KEY, 'my-list'] as const,
    myList: (params: MyPostListParams = {}) =>
      [...POST_ROOT_KEY, 'my-list', removeEmptyFields(params)] as const,
  },
}
