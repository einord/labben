import { staticSitesService } from '../../../services/static-sites'
import { extractErrorMessage } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Valid site ID is required' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  }

  const file = formData.find(f => f.name === 'file')
  if (!file || !file.data || !file.filename) {
    throw createError({ statusCode: 400, statusMessage: 'File is required' })
  }

  const filename = file.filename.toLowerCase()
  const supported = filename.endsWith('.zip') || filename.endsWith('.tar.gz') || filename.endsWith('.tgz')
  if (!supported) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported file format. Use .zip, .tar.gz, or .tgz' })
  }

  try {
    await staticSitesService.uploadSiteArchive(id, file.data, file.filename)
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === 'Site not found') {
      throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    }
    throw createError({ statusCode: 500, statusMessage: extractErrorMessage(error, 'Failed to upload archive') })
  }
})
