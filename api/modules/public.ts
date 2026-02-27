import { request } from '@/api/request'

interface SystemConfigData {
  item_types?: string[]
  item_config?: string[]
  itemConfig?: string[]
  itemconfig?: string[]
  feedback_types?: string[]
  claim_validity_days?: number
  publish_limit?: number
}

export interface PublicConfig {
  itemTypes: string[]
  feedbackTypes: string[]
  claimValidityDays: number
  publishLimit: number
}

export function getPublicConfig() {
  return request<SystemConfigData>({
    url: '/system/config',
    method: 'GET',
  }).then((result) => {
    const itemTypes
      = result.item_types
        || result.item_config
        || result.itemConfig
        || result.itemconfig
        || []

    return {
      itemTypes,
      feedbackTypes: result.feedback_types || [],
      claimValidityDays: Number(result.claim_validity_days || 0),
      publishLimit: Number(result.publish_limit || 0),
    }
  })
}
