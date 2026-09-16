import { defineHandler, getRouterParam, getQuery } from 'h3'
import { sendSuccess, sendError } from '../../../../utils/response'
import { RoomService } from '../../../../services/RoomService'
import { requireAuth } from '../../../../middleware/auth'
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../../../../utils/errors'

const service = new RoomService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const propertyId = getRouterParam(event, 'id')
    if (!propertyId) return sendError(event, new NotFoundError('Property'))

    const query = getQuery(event)
    const page = Math.max(1, parseInt(String(query.page ?? 1), 10))
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20), 10)))

    const result = await service.getRoomsByProperty(propertyId, user.id, page, limit)
    return sendSuccess(event, result.rooms, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit)
    })
  } catch (error: any) {
    if (error.message === 'Property not found') {
      return sendError(event, new NotFoundError('Property'))
    }
    if (error.message === 'Unauthorized property access') {
      return sendError(event, new ForbiddenError('Unauthorized property access'))
    }
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return sendError(event, new UnauthorizedError())
    }
    throw error
  }
})
