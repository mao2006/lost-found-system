import type { CreateAgentSessionPayload } from '@/api/modules/agent'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAgentSession,
  getAgentHistory,
  getAgentSessions,
} from '@/api/modules/agent'
import { queryKeys } from '@/api/queryKeys'

function normalizeSessionId(sessionId?: string) {
  return String(sessionId || '').trim()
}

export function useAgentSessionsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.agent.sessions(),
    queryFn: getAgentSessions,
    enabled,
  })
}

export function useAgentHistoryQuery(sessionId?: string, enabled = true) {
  const normalizedSessionId = normalizeSessionId(sessionId)

  return useQuery({
    queryKey: queryKeys.agent.history({ session_id: normalizedSessionId }),
    queryFn: () => {
      if (!normalizedSessionId)
        throw new Error('sessionId 不能为空')

      return getAgentHistory(normalizedSessionId)
    },
    enabled: enabled && !!normalizedSessionId,
  })
}

export function useCreateAgentSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload?: CreateAgentSessionPayload) => createAgentSession(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.agent.sessions() })
    },
  })
}
