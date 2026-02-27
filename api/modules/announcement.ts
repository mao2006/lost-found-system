import { request } from '@/api/request'

export interface AnnouncementListParams {
  page?: number
  page_size?: number
}

export interface AnnouncementItem {
  id: number
  title: string
  content: string
  type: string
  created_at: string
}

export interface AnnouncementListData {
  list: AnnouncementItem[]
  page: number
  page_size: number
  total: number
}

export function getAnnouncementList(params: AnnouncementListParams = {}) {
  const page = Math.max(1, Math.trunc(params.page || 1))
  const pageSize = Math.min(50, Math.max(1, Math.trunc(params.page_size || 10)))

  return request<AnnouncementListData>({
    url: '/announcement/list',
    method: 'GET',
    params: {
      ...params,
      page,
      page_size: pageSize,
    },
  })
}
