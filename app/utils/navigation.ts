export interface NavItem {
  labelKey: string
  icon: string
  to: string
}

export const NAV_ITEMS: readonly NavItem[] = [
  { labelKey: 'nav.dashboard', icon: 'lucide:layout-dashboard', to: '/' },
  { labelKey: 'nav.projects', icon: 'lucide:folder-open', to: '/projects' },
] as const

export const PROXY_NAV_ITEM: NavItem = {
  labelKey: 'nav.proxy', icon: 'lucide:route', to: '/proxy',
}

export const BACKUP_NAV_ITEM: NavItem = {
  labelKey: 'nav.backup', icon: 'lucide:hard-drive-download', to: '/backup',
}
