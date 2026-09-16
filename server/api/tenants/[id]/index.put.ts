import { defineHandler, readBody, getRouterParam } from 'h3'
import { sendSuccess, sendError } from '../../../utils/response'
import { ValidationError, NotFoundError, UnauthorizedError } from '../../../utils/errors'
import { TenantService } from '../../../services/TenantService'
import { updateTenantSchema } from '../../../schemas/tenant'
import { requireAuth } from '../../../middleware/auth'

const service = new TenantService()

export default defineHandler(async (event) => {
  try {
    requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) return sendError(event, new NotFoundError('Tenant'))

    const body = await readBody(event)
    const parsed = updateTenantSchema.safeParse(body)
    if (!parsed.success) {
      const details: Record<string, string> = {}
      for (const err of parsed.error.issues) {
        details[err.path.join('.')] = err.message
      }
      return sendError(event, new ValidationError(details))
    }

    const result = await service.updateTenant(id, parsed.data)
    if (!result) return sendError(event, new NotFoundError('Tenant'))

    return sendSuccess(event, result)
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return sendError(event, new UnauthorizedError())
    }
    throw error
  }
})
