'use client'

import type { LostFoundListParams, PostStatus } from '@/api/modules/lostFound'
import type { CampusCode, ItemPostType, ItemStatus, QueryFilters, TimeRangeValue } from '@/components/query/types'
import { Button, Card, Flex, Typography } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import { mapPostListItemToLostFoundItem } from '@/api/modules/lostFound'
import {
  CAMPUS_OPTIONS,
  PUBLISH_TYPE_OPTIONS,
  STATUS_OPTIONS,
  TIME_RANGE_HOUR_MAP,
  TIME_RANGE_OPTIONS,
} from '@/components/query/constants'
import FilterPanel from '@/components/query/FilterPanel'
import ItemList from '@/components/query/ItemList'
import { toTimestamp } from '@/components/query/utils'
import { useLostFoundListQuery } from '@/hooks/queries/useLostFoundQueries'

const { Paragraph, Title } = Typography

interface QueryPageState {
  filters: QueryFilters
  hasViewed: boolean
}

const VALID_TIME_RANGE = new Set<TimeRangeValue>(
  TIME_RANGE_OPTIONS.map(option => option.value),
)
const VALID_POST_TYPE = new Set<ItemPostType>(
  PUBLISH_TYPE_OPTIONS.map(option => option.value),
)
const VALID_CAMPUS = new Set<CampusCode>(
  CAMPUS_OPTIONS.map(option => option.value),
)
const VALID_STATUS = new Set<ItemStatus>(
  STATUS_OPTIONS.map(option => option.value),
)

const STATUS_TO_BACKEND_MAP: Record<ItemStatus, PostStatus> = {
  寻找中: 'APPROVED',
  待认领: 'APPROVED',
  已归还: 'SOLVED',
}

function toPostPublishType(postType: ItemPostType) {
  return postType === '招领' ? 'FOUND' : 'LOST'
}

function buildListParams(filters: QueryFilters): LostFoundListParams {
  const params: LostFoundListParams = {
    publish_type: filters.publishType ? toPostPublishType(filters.publishType) : undefined,
    item_type: filters.itemType?.trim() || undefined,
    campus: filters.campus,
    location: filters.location?.trim() || undefined,
    status: filters.status ? STATUS_TO_BACKEND_MAP[filters.status] : undefined,
    page: 1,
    page_size: 10,
  }

  if (filters.timeRange) {
    const hours = TIME_RANGE_HOUR_MAP[filters.timeRange]
    const endTime = Date.now()
    const startTime = endTime - hours * 60 * 60 * 1000
    params.start_time = new Date(startTime).toISOString()
    params.end_time = new Date(endTime).toISOString()
  }

  return params
}

function parseInitialState(searchParams: URLSearchParams): QueryPageState {
  const publishTypeValue = searchParams.get('publishType')
  const itemType = searchParams.get('itemType')?.trim()
  const campusValue = searchParams.get('campus')
  const location = searchParams.get('location')?.trim()
  const timeRangeValue = searchParams.get('timeRange')
  const statusValue = searchParams.get('status')

  return {
    filters: {
      publishType:
        publishTypeValue && VALID_POST_TYPE.has(publishTypeValue as ItemPostType)
          ? (publishTypeValue as ItemPostType)
          : undefined,
      itemType: itemType || undefined,
      campus:
        campusValue && VALID_CAMPUS.has(campusValue as CampusCode)
          ? (campusValue as CampusCode)
          : undefined,
      location: location || undefined,
      timeRange:
        timeRangeValue && VALID_TIME_RANGE.has(timeRangeValue as TimeRangeValue)
          ? (timeRangeValue as TimeRangeValue)
          : undefined,
      status:
        statusValue && VALID_STATUS.has(statusValue as ItemStatus)
          ? (statusValue as ItemStatus)
          : undefined,
    },
    hasViewed: searchParams.get('viewed') === '1',
  }
}

function buildSearchText(filters: QueryFilters, hasViewed: boolean) {
  const params = new URLSearchParams()

  if (filters.publishType)
    params.set('publishType', filters.publishType)
  if (filters.itemType)
    params.set('itemType', filters.itemType)
  if (filters.campus)
    params.set('campus', filters.campus)
  if (filters.location)
    params.set('location', filters.location)
  if (filters.timeRange)
    params.set('timeRange', filters.timeRange)
  if (filters.status)
    params.set('status', filters.status)
  if (hasViewed)
    params.set('viewed', '1')

  return params.toString()
}

function QueryPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRef = useRef<QueryPageState | null>(null)
  if (!initialRef.current)
    initialRef.current = parseInitialState(new URLSearchParams(searchParams.toString()))

  const [filters, setFilters] = useState<QueryFilters>(initialRef.current.filters)
  const [hasViewed, setHasViewed] = useState(initialRef.current.hasViewed)
  const [hasSearchedOnce, setHasSearchedOnce] = useState(initialRef.current.hasViewed)
  const listParams = useMemo(
    () => buildListParams(filters),
    [filters],
  )
  const listQuery = useLostFoundListQuery(listParams, hasViewed)
  const filteredItems = useMemo(
    () =>
      (listQuery.data?.list || [])
        .map(mapPostListItemToLostFoundItem)
        .sort((left, right) => toTimestamp(right.occurredAt) - toTimestamp(left.occurredAt)),
    [listQuery.data?.list],
  )

  const syncSearch = (nextFilters: QueryFilters, nextHasViewed: boolean) => {
    const searchText = buildSearchText(nextFilters, nextHasViewed)
    const route = searchText ? `/query?${searchText}` : '/query'
    router.replace(route, { scroll: false })
  }

  const handleFiltersChange = (nextFilters: QueryFilters) => {
    setFilters(nextFilters)
    setHasViewed(false)
    syncSearch(nextFilters, false)
  }

  const handleView = () => {
    setHasViewed(true)
    setHasSearchedOnce(true)
    syncSearch(filters, true)
  }

  const handleSelectItem = (itemId: string) => {
    router.push(`/query/${itemId}`)
  }

  return (
    <Flex vertical gap={12} align="center" className="w-full">
      {!hasSearchedOnce && (
        <Card
          className="w-full max-w-5xl rounded-lg border-blue-100"
          styles={{ body: { padding: 14 } }}
        >
          <Title level={4} className="!mb-2 !text-blue-700">
            查询信息
          </Title>
          <Paragraph className="!mb-0 !text-blue-900/70">
            请选择至少一个筛选标准并点击“查看”，即可浏览物品列表与详情。
          </Paragraph>
        </Card>
      )}

      <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onView={handleView}
      />

      {hasViewed && (
        <>
          {listQuery.isError && (
            <Card
              className="w-full max-w-5xl rounded-lg border-blue-100"
              styles={{ body: { padding: 14 } }}
            >
              <Flex vertical gap={8}>
                <Paragraph className="!mb-0 !text-red-500">
                  {listQuery.error instanceof Error
                    ? listQuery.error.message
                    : '查询失败，请稍后重试'}
                </Paragraph>
                <Flex>
                  <Button onClick={() => listQuery.refetch()} className="rounded-lg">
                    重试
                  </Button>
                </Flex>
              </Flex>
            </Card>
          )}

          {!listQuery.isError && (
            <ItemList
              items={filteredItems}
              total={listQuery.data?.total}
              loading={listQuery.isFetching}
              onSelectItem={handleSelectItem}
            />
          )}
        </>
      )}
    </Flex>
  )
}

export default QueryPageClient
