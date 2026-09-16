import { defineHandler, getRouterParam, readBody } from 'h3'
import { sendSuccess, sendError } from '../../../../utils/response'
import { RoomService } from '../../../../services/RoomService'
import { roomSchema } from '../../../../schemas/room'
import { requireAuth } from '../../../../middleware/auth'
import { NotFoundError, ValidationError, UnauthorizedError, ForbiddenError } from '../../../../utils/errors'

const service = new RoomService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const propertyId = getRouterParam(event, 'id')
    if (!propertyId) return sendError(event, new NotFoundError('Property'))

    const body = await readBody(event)
    const parsed = roomSchema.safeParse(body)
    if (!parsed.success) {
      const details: Record<string, string> = {}
      for (const err of parsed.error.issues) {
        details[err.path.join('.')] = err.message
      }
      return sendError(event, new ValidationError(details))
    }

    const room = await service.createRoom(propertyId, user.id, parsed.data)
    return sendSuccess(event, room, undefined, 201)
  } catch (error: any) {
    if (error.message === 'Property not found') {
      return sendError(event, new NotFoundError('Property'))
    }
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
