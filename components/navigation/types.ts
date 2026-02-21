export interface NavItem {
  key: 'query' | 'publish' | 'my-posts'
  label: string
  path: '/query' | '/publish' | '/my-posts'
}

export interface FeedbackRecord {
  id: string
  content: string
  createdAt: string
  status: '已处理' | '处理中'
}
