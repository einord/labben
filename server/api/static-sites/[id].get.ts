import { staticSitesService } from '../../services/static-sites'

export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Valid site ID is required' })
  }

  const site = staticSitesService.getSite(id)
  if (!site) {
    throw createError({ statusCode: 404, statusMessage: 'Site not found' })
  }

  return { success: true, data: site }
})
