'use client'

import type { ItemStatus, QueryFilters, TimeRangeValue } from '@/components/query/types'
import { Card, Flex, Typography } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import { STATUS_OPTIONS, TIME_RANGE_OPTIONS } from '@/components/query/constants'
import FilterPanel from '@/components/query/FilterPanel'
import ItemList from '@/components/query/ItemList'
import { isWithinTimeRange, toTimestamp } from '@/components/query/utils'
import { useLostFoundStore } from '@/stores/lostFoundStore'

const { Paragraph, Title } = Typography

interface QueryPageState {
  filters: QueryFilters
  hasViewed: boolean
}

const VALID_TIME_RANGE = new Set<TimeRangeValue>(
  TIME_RANGE_OPTIONS.map(option => option.value),
)
const VALID_STATUS = new Set<ItemStatus>(
  STATUS_OPTIONS.map(option => option.value),
)

function parseInitialState(searchParams: URLSearchParams): QueryPageState {
  const itemType = searchParams.get('itemType')?.trim()
  const location = searchParams.get('location')?.trim()
  const timeRangeValue = searchParams.get('timeRange')
  const statusValue = searchParams.get('status')

  return {
    filters: {
      itemType: itemType || undefined,
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

  if (filters.itemType)
    params.set('itemType', filters.itemType)
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
  const items = useLostFoundStore(state => state.items)

  const filteredItems = useMemo(() => {
    const result = items
      .filter((item) => {
        if (filters.itemType && item.itemType !== filters.itemType)
          return false
        if (filters.location && item.location !== filters.location)
          return false
        if (filters.status && item.status !== filters.status)
          return false
        if (!isWithinTimeRange(item.occurredAt, filters.timeRange))
          return false

        return true
      })
      .sort((left, right) => toTimestamp(right.occurredAt) - toTimestamp(left.occurredAt))

    return result
  }, [filters.itemType, filters.location, filters.status, filters.timeRange, items])

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
        <ItemList
          items={filteredItems}
          onSelectItem={handleSelectItem}
        />
      )}
    </Flex>
  )
}

export default QueryPageClient
