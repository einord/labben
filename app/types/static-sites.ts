export interface StaticSite {
  id: number
  domain: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateStaticSiteData {
  domain: string
}

export interface UpdateStaticSiteData {
  domain?: string
  enabled?: boolean
}

export interface StaticSitesStatus {
  containerRunning: boolean
  siteCount: number
  managedContainerExists: boolean
}
