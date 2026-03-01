export interface NavItem {
  key: 'query' | 'publish' | 'my-posts' | 'agent'
  label: string
  path: '/query' | '/publish' | '/my-posts' | '/agent'
}
