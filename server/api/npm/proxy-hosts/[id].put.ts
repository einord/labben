import type { CreateProxyHostData } from '~/types/npm'
import { npmApiService } from '../../../services/npm-api'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Valid proxy host ID is required' })
  }

  const body = await readBody<Partial<CreateProxyHostData>>(event)

  if (!body.domainNames?.length) {
    throw createError({ statusCode: 400, message: 'At least one domain name is required' })
  }
  if (!body.forwardHost?.trim()) {
    throw createError({ statusCode: 400, message: 'Forward host is required' })
  }
  if (!body.forwardPort || body.forwardPort < 1) {
    throw createError({ statusCode: 400, message: 'Valid forward port is required' })
  }

  try {
    const host = await npmApiService.updateProxyHost(id, {
      domainNames: body.domainNames,
      forwardScheme: body.forwardScheme ?? 'http',
      forwardHost: body.forwardHost.trim(),
      forwardPort: body.forwardPort,
      sslForced: body.sslForced ?? false,
      allowWebsocketUpgrade: body.allowWebsocketUpgrade ?? true,
      blockExploits: body.blockExploits ?? true,
      http2Support: body.http2Support ?? true,
      meta: body.meta,
    })
    return { success: true, data: host }
  } catch (error) {
    throw createError({ statusCode: 500, message: extractErrorMessage(error, 'Failed to update proxy host') })
  }
})
