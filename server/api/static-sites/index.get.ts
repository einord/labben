import { staticSitesService } from '../../services/static-sites'

export default defineEventHandler(() => {
  const sites = staticSitesService.getSites()
  return { success: true, data: sites }
})
