import { defineHandler, getRouterParam, readBody } from 'h3'
import { sendSuccess, sendError } from '../../../../utils/response'
import { RentPriceService } from '../../../../services/RentPriceService'
import { rentPriceSchema } from '../../../../schemas/rentPrice'
import { requireAuth } from '../../../../middleware/auth'
import { NotFoundError, ValidationError, UnauthorizedError, ForbiddenError, ConflictError } from '../../../../utils/errors'

const service = new RentPriceService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const path = event.node.req.url || ''
    const match = path.match(/\/api\/rooms\/([a-fA-F0-9]{24})\/rent-prices/)
    const roomId = match ? match[1] : getRouterParam(event, 'roomId')

    if (!roomId) return sendError(event, new NotFoundError('Room'))

    const body = await readBody(event)
    const parsed = rentPriceSchema.safeParse(body)
    if (!parsed.success) {
      const details: Record<string, string> = {}
      for (const err of parsed.error.issues) {
        details[err.path.join('.')] = err.message
      }
      return sendError(event, new ValidationError(details))
    }

    const result = await service.createRentPrice(roomId, user.id, parsed.data)
    return sendSuccess(event, result, undefined, 201)
  } catch (error: any) {
    if (error.message === 'Overlapping price periods') {
      return sendError(event, new ConflictError('Rent price period overlaps with an existing period'))
    }
    if (error.message === 'Room not found' || error.message === 'Property not found') {
      return sendError(event, new NotFoundError('Room'))
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
