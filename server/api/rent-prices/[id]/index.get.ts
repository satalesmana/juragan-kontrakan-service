import { defineHandler, getRouterParam } from 'h3'
import { sendSuccess, sendError } from '../../../utils/response'
import { RentPriceService } from '../../../services/RentPriceService'
import { requireAuth } from '../../../middleware/auth'
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../../../utils/errors'

const service = new RentPriceService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) return sendError(event, new NotFoundError('Rent price'))

    const rentPrice = await service.getRentPriceById(id, user.id)
    if (!rentPrice) return sendError(event, new NotFoundError('Rent price'))

    return sendSuccess(event, rentPrice)
  } catch (error: any) {
    if (error.message === 'Room not found' || error.message === 'Property not found') {
      return sendError(event, new NotFoundError('Rent price'))
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
