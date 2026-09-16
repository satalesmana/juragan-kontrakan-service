import { defineHandler, getRouterParam } from 'h3'
import { sendSuccess, sendError } from '../../../utils/response'
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../../../utils/errors'
import { PropertyService } from '../../../services/PropertyService'
import { requireAuth } from '../../../middleware/auth'

const service = new PropertyService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) {
      return sendError(event, new NotFoundError('Property'))
    }

    const property = await service.getPropertyById(id, user.id)
    if (!property) return sendError(event, new NotFoundError('Property'))
    return sendSuccess(event, property)
  } catch (error: any) {
    if (error.message === 'Unauthorized property access') {
      return sendError(event, new ForbiddenError('Unauthorized property access'))
    }
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return sendError(event, new UnauthorizedError())
    }
    throw error
  }
})
