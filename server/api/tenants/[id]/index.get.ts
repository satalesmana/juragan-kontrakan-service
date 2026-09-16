import { defineHandler, getRouterParam } from 'h3'
import { sendSuccess, sendError } from '../../../utils/response'
import { NotFoundError, UnauthorizedError } from '../../../utils/errors'
import { TenantService } from '../../../services/TenantService'
import { requireAuth } from '../../../middleware/auth'

const service = new TenantService()

export default defineHandler(async (event) => {
  try {
    requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) return sendError(event, new NotFoundError('Tenant'))

    const tenant = await service.getTenantById(id)
    if (!tenant) return sendError(event, new NotFoundError('Tenant'))

    return sendSuccess(event, tenant)
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return sendError(event, new UnauthorizedError())
    }
    throw error
  }
})
