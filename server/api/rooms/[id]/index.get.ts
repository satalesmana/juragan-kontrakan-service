import { defineHandler, getRouterParam } from 'h3'
import { sendSuccess, sendError } from '../../../utils/response'
import { RoomService } from '../../../services/RoomService'
import { requireAuth } from '../../../middleware/auth'
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../../../utils/errors'

const service = new RoomService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) return sendError(event, new NotFoundError('Room'))

    const room = await service.getRoomById(id, user.id)
    if (!room) return sendError(event, new NotFoundError('Room'))

    return sendSuccess(event, room)
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
