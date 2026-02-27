'use client'

import type { PostCampus, PostPublishType } from '@/api/modules/lostFound'
import type { PublishDraft, PublishFormValues } from '@/components/publish/types'
import type { ItemPostType } from '@/components/query/types'
import { Alert, Button, Card, Flex, Form, Input, message, Modal, Radio, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { CONTACT_PHONE_PATTERN, PUBLISH_DRAFT_STORAGE_KEY } from '@/components/publish/constants'
import PhotoUploader from '@/components/publish/PhotoUploader'
import PublishFilters from '@/components/publish/PublishFilters'
import PublishTypeSwitch from '@/components/publish/PublishTypeSwitch'
import { CAMPUS_OPTIONS, ITEM_TYPE_OPTIONS, ITEM_TYPE_OTHER_VALUE } from '@/components/query/constants'
import { usePublicConfigQuery } from '@/hooks/queries/usePublicQueries'
import { usePublishPostMutation } from '@/hooks/queries/useUserPostQueries'

const { Text } = Typography
const { TextArea } = Input

const DRAFT_RESTORED_MESSAGE_KEY = 'publish-draft-restored'
const VALID_POST_TYPES = new Set<ItemPostType>(['失物', '招领'])
const VALID_CAMPUS = new Set<PostCampus>(CAMPUS_OPTIONS.map(option => option.value))
const OTHER_ITEM_TYPE_LABEL = '其它'

function normalizeItemTypeValues(values: string[]) {
  return Array.from(
    new Set(
      values
        .map(value => value.trim())
        .filter(Boolean)
        .filter(value => value !== ITEM_TYPE_OTHER_VALUE),
    ),
  )
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value))
    return []

  return value.filter(item => typeof item === 'string').slice(0, 3)
}

function toOptionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function toDateValue(value?: string) {
  if (!value)
    return undefined

  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return undefined

  const pad = (input: number) => String(input).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function toIsoDateText(value?: string) {
  if (!value)
    return new Date().toISOString()

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function toPostPublishType(postType: ItemPostType): PostPublishType {
  return postType === '招领' ? 'FOUND' : 'LOST'
}

function isFormValidationError(error: unknown): error is { errorFields: unknown[] } {
  return typeof error === 'object' && error !== null && 'errorFields' in error
}

function toOptionalPostType(value: unknown) {
  if (typeof value !== 'string')
    return undefined

  return VALID_POST_TYPES.has(value as ItemPostType) ? (value as ItemPostType) : undefined
}

function toOptionalCampus(value: unknown) {
  if (typeof value !== 'string')
    return undefined

  return VALID_CAMPUS.has(value as PostCampus) ? (value as PostCampus) : undefined
}

function readDraft() {
  if (typeof window === 'undefined')
    return null

  try {
    const raw = window.localStorage.getItem(PUBLISH_DRAFT_STORAGE_KEY)
    if (!raw)
      return null

    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return null

    const draft: PublishDraft = {
      postType: toOptionalPostType(parsed.postType),
      campus: toOptionalCampus(parsed.campus),
      itemType: toOptionalString(parsed.itemType),
      location: toOptionalString(parsed.location),
      itemName: toOptionalString(parsed.itemName),
      occurredAt: toOptionalString(parsed.occurredAt),
      features: toOptionalString(parsed.features),
      contactName: toOptionalString(parsed.contactName),
      contactPhone: toOptionalString(parsed.contactPhone),
      hasReward: typeof parsed.hasReward === 'boolean' ? parsed.hasReward : false,
      rewardRemark: toOptionalString(parsed.rewardRemark),
      photos: toStringArray(parsed.photos),
    }

    return draft
  }
  catch {
    return null
  }
}

function clearDraft() {
  if (typeof window === 'undefined')
    return

  window.localStorage.removeItem(PUBLISH_DRAFT_STORAGE_KEY)
}

function writeDraft(draft: PublishDraft) {
  if (typeof window === 'undefined')
    return

  window.localStorage.setItem(PUBLISH_DRAFT_STORAGE_KEY, JSON.stringify(draft))
}

function buildDraft(values: PublishFormValues, photos: string[]): PublishDraft {
  return {
    postType: values.postType,
    campus: values.campus,
    itemType: values.itemType,
    location: values.location,
    itemName: values.itemName,
    occurredAt: values.occurredAt,
    features: values.features,
    contactName: values.contactName,
    contactPhone: values.contactPhone,
    hasReward: !!values.hasReward,
    rewardRemark: values.rewardRemark,
    photos: photos.slice(0, 3),
  }
}

function isDraftEmpty(draft: PublishDraft) {
  return !(
    draft.postType
    || draft.campus
    || draft.itemType
    || draft.location
    || draft.itemName
    || draft.occurredAt
    || draft.features
    || draft.contactName
    || draft.contactPhone
    || draft.hasReward
    || draft.rewardRemark
    || draft.photos.length
  )
}

function PublishPage() {
  const [form] = Form.useForm<PublishFormValues>()
  const publishPostMutation = usePublishPostMutation()
  const publicConfigQuery = usePublicConfigQuery()

  const [photos, setPhotos] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [draftReady, setDraftReady] = useState(false)
  const [otherItemTypeInput, setOtherItemTypeInput] = useState('')
  const [otherItemTypeMode, setOtherItemTypeMode] = useState(false)

  const watchedValues = Form.useWatch([], form) as PublishFormValues | undefined
  const postType = Form.useWatch('postType', form)
  const campus = Form.useWatch('campus', form)
  const hasReward = Form.useWatch('hasReward', form)
  const itemType = Form.useWatch('itemType', form)
  const location = Form.useWatch('location', form)

  const baseItemTypeOptions = useMemo(() => {
    const itemTypes = normalizeItemTypeValues(publicConfigQuery.data?.itemTypes || [])
    if (!itemTypes.length)
      return ITEM_TYPE_OPTIONS

    return itemTypes.map(type => ({
      label: type,
      value: type,
    }))
  }, [publicConfigQuery.data?.itemTypes])

  const presetItemTypeValues = useMemo(
    () => baseItemTypeOptions.map(option => option.value),
    [baseItemTypeOptions],
  )

  const itemTypeOptions = useMemo(
    () => [...baseItemTypeOptions, { label: OTHER_ITEM_TYPE_LABEL, value: ITEM_TYPE_OTHER_VALUE }],
    [baseItemTypeOptions],
  )

  const hasCustomItemType = useMemo(
    () => !!itemType && !presetItemTypeValues.includes(itemType),
    [itemType, presetItemTypeValues],
  )

  const showOtherItemTypeInput = otherItemTypeMode || hasCustomItemType
  const itemTypeSelectValue = showOtherItemTypeInput ? ITEM_TYPE_OTHER_VALUE : itemType

  useEffect(() => {
    const draft = readDraft()
    if (!draft) {
      queueMicrotask(() => {
        setDraftReady(true)
      })
      return
    }

    form.setFieldsValue({
      ...draft,
      occurredAt: toDateValue(draft.occurredAt),
    })
    queueMicrotask(() => {
      setPhotos(draft.photos)
      setDraftReady(true)
    })
    message.open({
      type: 'info',
      key: DRAFT_RESTORED_MESSAGE_KEY,
      content: '已恢复未提交的编辑内容',
    })
  }, [form])

  useEffect(() => {
    if (!draftReady || !watchedValues)
      return

    const draft = buildDraft(watchedValues, photos)
    if (isDraftEmpty(draft)) {
      clearDraft()
      return
    }

    writeDraft(draft)
  }, [draftReady, photos, watchedValues])

  useEffect(() => {
    if (hasReward === false)
      form.setFieldValue('rewardRemark', undefined)
  }, [form, hasReward])

  useEffect(() => {
    if (!itemType || presetItemTypeValues.includes(itemType))
      return

    setOtherItemTypeMode(true)
    setOtherItemTypeInput(itemType)
  }, [itemType, presetItemTypeValues])

  const handleReset = () => {
    Modal.confirm({
      title: '确认取消当前填写？',
      content: '取消后会清空当前编辑内容。',
      okText: '确认取消',
      cancelText: '继续编辑',
      onOk: () => {
        form.resetFields()
        setPhotos([])
        setSubmitted(false)
        setOtherItemTypeMode(false)
        setOtherItemTypeInput('')
        clearDraft()
      },
    })
  }

  const handleSubmit = async () => {
    setSubmitted(false)

    try {
      const values = await form.validateFields()
      if (values.postType === '招领' && photos.length === 0) {
        message.warning('发布招领信息时，请至少上传 1 张物品清晰照片')
        return
      }

      setSubmitting(true)
      const itemTypeValue = (values.itemType ?? '').trim()
      const resolvedPostType = values.postType as ItemPostType
      const normalizedLocation = (values.location ?? '').trim()
      const storageLocation = normalizedLocation

      await publishPostMutation.mutateAsync({
        publish_type: toPostPublishType(resolvedPostType),
        item_name: (values.itemName ?? '').trim(),
        item_type: itemTypeValue,
        campus: values.campus as PostCampus,
        location: normalizedLocation,
        storage_location: storageLocation,
        event_time: toIsoDateText(values.occurredAt),
        features: (values.features ?? '').trim(),
        contact_name: (values.contactName ?? '').trim(),
        contact_phone: (values.contactPhone ?? '').trim(),
        has_reward: !!values.hasReward,
        reward_description: values.hasReward ? (values.rewardRemark ?? '').trim() : '',
        images: photos.slice(0, 3),
      })

      message.success('已提交信息，等待审核中...')
      setSubmitted(true)
      form.resetFields()
      setPhotos([])
      setOtherItemTypeMode(false)
      setOtherItemTypeInput('')
      clearDraft()
    }
    catch (error) {
      if (isFormValidationError(error)) {
        message.warning('请先完善必填项并确认联系方式格式')
        return
      }

      message.error(error instanceof Error ? error.message : '提交失败，请稍后重试')
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <Flex vertical gap={12} align="center" className="w-full">
      <Card
        className="w-full max-w-5xl rounded-lg border-blue-100"
        styles={{ body: { padding: 16 } }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ hasReward: false, campus: 'PING_FENG' }}
          onValuesChange={() => setSubmitted(false)}
        >
          <Flex vertical gap={12}>
            <Flex vertical gap={8}>
              <Flex align="center" gap={4}>
                <Text className="text-red-500">*</Text>
                <Text className="text-sm font-medium text-blue-900">发布类型</Text>
              </Flex>
              <Form.Item
                name="postType"
                className="!mb-0"
                rules={[{ required: true, message: '请选择发布类型' }]}
              >
                <PublishTypeSwitch
                  value={postType}
                  onChange={value => form.setFieldValue('postType', value)}
                />
              </Form.Item>
            </Flex>

            <PublishFilters
              campus={campus}
              itemType={itemTypeSelectValue}
              location={location}
              campusOptions={CAMPUS_OPTIONS}
              itemTypeOptions={itemTypeOptions}
              onCampusChange={(value) => {
                setSubmitted(false)
                form.setFieldValue('campus', value)
              }}
              onItemTypeChange={(value) => {
                setSubmitted(false)
                if (value === ITEM_TYPE_OTHER_VALUE) {
                  setOtherItemTypeMode(true)
                  setOtherItemTypeInput(hasCustomItemType && itemType ? itemType : '')
                  if (!hasCustomItemType)
                    form.setFieldValue('itemType', undefined)
                  return
                }

                setOtherItemTypeMode(false)
                setOtherItemTypeInput('')
                form.setFieldValue('itemType', value)
              }}
              onLocationChange={(value) => {
                setSubmitted(false)
                form.setFieldValue('location', value)
              }}
            />
            {showOtherItemTypeInput && (
              <Form.Item
                label="其它类型说明"
                className="!mb-0"
                required
              >
                <Input
                  value={otherItemTypeInput}
                  maxLength={20}
                  showCount
                  placeholder="请输入其它物品类型（最多20字）"
                  onChange={(event) => {
                    setSubmitted(false)
                    const nextValue = event.target.value
                    setOtherItemTypeInput(nextValue)
                    form.setFieldValue('itemType', nextValue || undefined)
                  }}
                />
              </Form.Item>
            )}

            <Form.Item
              name="campus"
              hidden
              rules={[{ required: true, message: '请选择校区' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="itemType"
              hidden
              rules={[
                { required: true, message: '请选择或输入物品类型' },
                { max: 20, message: '物品类型最多 20 个字符' },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="location"
              hidden
              rules={[{ required: true, message: '请输入丢失/拾取地点' }]}
            >
              <Input />
            </Form.Item>
            <Flex gap={8} wrap>
              <Form.Item
                name="itemName"
                label="物品名称"
                className="!mb-0 w-full md:w-[calc(50%-4px)]"
                rules={[{ required: true, message: '请输入物品名称' }]}
              >
                <Input
                  maxLength={50}
                  placeholder="请输入物品名称"
                />
              </Form.Item>

              <Form.Item
                name="occurredAt"
                label="丢失/拾取日期"
                className="!mb-0 w-full md:w-[calc(50%-4px)]"
                rules={[{ required: true, message: '请选择丢失/拾取日期' }]}
              >
                <Input
                  type="date"
                  className="w-full"
                  placeholder="请选择日期"
                />
              </Form.Item>
            </Flex>

            <Form.Item
              name="features"
              label="物品特征"
              className="!mb-0"
              rules={[{ required: true, message: '请输入物品特征' }]}
            >
              <TextArea
                rows={4}
                maxLength={255}
                showCount
                placeholder="请输入可识别的外观、贴纸、划痕等特征"
              />
            </Form.Item>

            <Flex gap={8} wrap>
              <Form.Item
                name="contactName"
                label="联系人"
                className="!mb-0 w-full md:w-[calc(50%-4px)]"
                rules={[{ required: true, message: '请输入联系人姓名' }]}
              >
                <Input
                  maxLength={30}
                  placeholder="请输入联系人"
                />
              </Form.Item>

              <Form.Item
                name="contactPhone"
                label="联系电话"
                className="!mb-0 w-full md:w-[calc(50%-4px)]"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { min: 5, message: '联系电话至少 5 位' },
                  { pattern: CONTACT_PHONE_PATTERN, message: '请输入正确的手机号或电话' },
                ]}
              >
                <Input
                  maxLength={20}
                  placeholder="请输入联系电话"
                />
              </Form.Item>
            </Flex>

            <Form.Item
              name="hasReward"
              label="是否有悬赏（可选）"
              className="!mb-0"
            >
              <Radio.Group
                options={[
                  { label: '无', value: false },
                  { label: '有', value: true },
                ]}
              />
            </Form.Item>

            {hasReward && (
              <Form.Item
                name="rewardRemark"
                label="悬赏说明（可选）"
                className="!mb-0"
              >
                <Input
                  maxLength={255}
                  placeholder="请输入悬赏说明（最多255字）"
                />
              </Form.Item>
            )}

            <Flex vertical gap={6}>
              <Text className="text-sm font-medium text-blue-900">物品照片（最多3张）</Text>
              <PhotoUploader
                photos={photos}
                onChange={(nextPhotos) => {
                  setSubmitted(false)
                  setPhotos(nextPhotos)
                }}
              />
              {!photos.length && (
                <Text className="text-xs text-blue-900/50">
                  当前暂无图片，可点击上传图标添加。
                </Text>
              )}
              {postType === '招领' && (
                <Text className="text-xs text-amber-600">
                  发布招领信息时，必须上传物品清晰照片，便于失主确认。
                </Text>
              )}
            </Flex>

            <Flex justify="end" gap={8} wrap>
              <Button
                className="rounded-lg"
                onClick={handleReset}
              >
                取消
              </Button>
              <Button
                type="primary"
                className="rounded-lg"
                loading={submitting}
                onClick={handleSubmit}
              >
                确认
              </Button>
            </Flex>

            {submitted && (
              <Alert
                showIcon
                type="success"
                message="已提交信息，等待审核中..."
              />
            )}
          </Flex>
        </Form>
      </Card>
    </Flex>
  )
}

export default PublishPage
