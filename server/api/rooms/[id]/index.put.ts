import { defineHandler, getRouterParam, readBody } from 'h3'
import { sendSuccess, sendError } from '../../../utils/response'
import { RoomService } from '../../../services/RoomService'
import { updateRoomSchema } from '../../../schemas/room'
import { requireAuth } from '../../../middleware/auth'
import { NotFoundError, ValidationError, UnauthorizedError, ForbiddenError } from '../../../utils/errors'

const service = new RoomService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) return sendError(event, new NotFoundError('Room'))

    const body = await readBody(event)
    const parsed = updateRoomSchema.safeParse(body)
    if (!parsed.success) {
      const details: Record<string, string> = {}
      for (const err of parsed.error.issues) {
        details[err.path.join('.')] = err.message
      }
      return sendError(event, new ValidationError(details))
    }

    const room = await service.updateRoom(id, user.id, parsed.data)
    if (!room) return sendError(event, new NotFoundError('Room'))

    return sendSuccess(event, room)
  } catch (error: any) {
    if (error.message === 'Room code already exists in this property') {
      return sendError(event, new ValidationError({ code: 'Room code already exists in this property' }))
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
