import { defineHandler, getRouterParam, getQuery } from 'h3'
import { sendSuccess, sendError } from '../../../../utils/response'
import { RentPriceService } from '../../../../services/RentPriceService'
import { requireAuth } from '../../../../middleware/auth'
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../../../../utils/errors'

const service = new RentPriceService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const roomId = getRouterParam(event, roomIdParamName(event)) || getRouterParam(event, 'roomId')
    
    // Fallback parsing route param
    const path = event.node.req.url || ''
    const match = path.match(/\/api\/rooms\/([a-fA-F0-9]{24})\/rent-prices/)
    const rId = match ? match[1] : roomId

    if (!rId) return sendError(event, new NotFoundError('Room'))

    // Check if query wants date lookup
    const query = getQuery(event)
    if (query.date) {
      const price = await service.getRoomPriceAtDate(rId, String(query.date))
      return sendSuccess(event, { roomId: rId, date: query.date, price })
    }

    const prices = await service.getRentPricesByRoom(rId, user.id)
    return sendSuccess(event, prices)
  } catch (error: any) {
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

function roomIdParamName(event: any) {
  return 'roomId'
}
