import { Flex, Input, Modal, Typography } from 'antd'

const { Text } = Typography

interface OtherTypeModalProps {
  open: boolean
  value: string
  onChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}

function OtherTypeModal({
  open,
  value,
  onChange,
  onCancel,
  onConfirm,
}: OtherTypeModalProps) {
  return (
    <Modal
      title="填写其它物品类型"
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="确认"
      cancelText="取消"
      destroyOnClose
    >
      <Flex vertical gap={8}>
        <Input
          value={value}
          maxLength={15}
          placeholder="请输入物品类型（最多15字）"
          onChange={event => onChange(event.target.value)}
        />
        <Flex justify="end" className="text-xs text-blue-900/50">
          <Text className="text-xs text-blue-900/50">{`${value.length} / 15`}</Text>
        </Flex>
      </Flex>
    </Modal>
  )
}

export default OtherTypeModal
