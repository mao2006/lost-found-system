import type { CampusCode } from '@/components/query/types'
import { Flex, Input, Select, Typography } from 'antd'

const { Text } = Typography

interface Option {
  label: string
  value: string
}

interface PublishFiltersProps {
  campus?: CampusCode
  itemType?: string
  location?: string
  campusOptions: Option[]
  itemTypeOptions: Option[]
  onCampusChange: (value?: CampusCode) => void
  onItemTypeChange: (value?: string) => void
  onLocationChange: (value?: string) => void
}

function Label({ text }: { text: string }) {
  return (
    <Flex align="center" gap={4}>
      <Text className="text-red-500">*</Text>
      <Text className="text-sm font-medium text-blue-900">{text}</Text>
    </Flex>
  )
}

function PublishFilters({
  campus,
  itemType,
  location,
  campusOptions,
  itemTypeOptions,
  onCampusChange,
  onItemTypeChange,
  onLocationChange,
}: PublishFiltersProps) {
  return (
    <Flex align="end" gap={8} wrap>
      <Flex vertical gap={6} className="w-full sm:w-[calc(50%-4px)] lg:w-[calc(33.333%-6px)]">
        <Label text="校区" />
        <Select
          value={campus}
          placeholder="请选择"
          options={campusOptions}
          onChange={value => onCampusChange(value as CampusCode)}
        />
      </Flex>

      <Flex vertical gap={6} className="w-full sm:w-[calc(50%-4px)] lg:w-[calc(33.333%-6px)]">
        <Label text="物品类型" />
        <Select
          value={itemType}
          placeholder="请选择"
          options={itemTypeOptions}
          onChange={value => onItemTypeChange(value)}
        />
      </Flex>

      <Flex vertical gap={6} className="w-full sm:w-[calc(50%-4px)] lg:w-[calc(33.333%-6px)]">
        <Label text="丢失/拾取地点" />
        <Input
          value={location}
          allowClear
          maxLength={100}
          placeholder="请输入地点"
          onChange={event => onLocationChange(event.target.value || undefined)}
        />
      </Flex>

    </Flex>
  )
}

export default PublishFilters
