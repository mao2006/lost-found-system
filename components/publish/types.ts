import type { CampusCode, ItemPostType, ItemStatus, TimeRangeValue } from '@/components/query/types'

export interface PublishFormValues {
  postType?: ItemPostType
  campus?: CampusCode
  itemType?: string
  location?: string
  itemName?: string
  occurredAt?: string
  features?: string
  contactName?: string
  contactPhone?: string
  hasReward?: boolean
  rewardRemark?: string
}

export interface PublishDraft {
  postType?: ItemPostType
  campus?: CampusCode
  itemType?: string
  location?: string
  itemName?: string
  occurredAt?: string
  features?: string
  contactName?: string
  contactPhone?: string
  hasReward: boolean
  rewardRemark?: string
  photos: string[]
}

export interface SubmitPublishPayload {
  postType: ItemPostType
  itemType: string
  location: string
  timeRange: TimeRangeValue
  status: ItemStatus
  itemName: string
  occurredAt: string
  features: string
  contactName: string
  contactPhone: string
  hasReward: boolean
  rewardRemark?: string
  photos: string[]
}

export type PublishReviewStatus = '待审核' | '已通过' | '已匹配' | '已认领' | '已驳回' | '已取消'

export interface PublishEditablePayload {
  itemType: string
  location: string
  itemName: string
  occurredAt: string
  features: string
  contactName: string
  contactPhone: string
  hasReward: boolean
  rewardRemark?: string
  photos: string[]
}

export interface PublishRecord extends SubmitPublishPayload {
  id: string
  createdAt: string
  reviewStatus: PublishReviewStatus
  rejectReason?: string
  updatedAt?: string
}
