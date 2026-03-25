export interface NavItem {
  label: string
  icon: string
  to: string
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', icon: 'lucide:layout-dashboard', to: '/' },
  { label: 'Projekt', icon: 'lucide:folder-open', to: '/projects' },
  { label: 'Containrar', icon: 'lucide:container', to: '/containers' },
  { label: 'Proxy', icon: 'lucide:route', to: '/proxy' },
  { label: 'Backup', icon: 'lucide:hard-drive-download', to: '/backup' },
] as const
