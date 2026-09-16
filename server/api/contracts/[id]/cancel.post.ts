import { defineHandler, getRouterParam } from 'h3'
import { sendSuccess, sendError } from '../../../utils/response'
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../../../utils/errors'
import { ContractService } from '../../../services/ContractService'
import { requireAuth } from '../../../middleware/auth'

const service = new ContractService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) return sendError(event, new NotFoundError('Contract'))

    const result = await service.cancelContract(id, user.id)
    if (!result) return sendError(event, new NotFoundError('Contract'))

    return sendSuccess(event, result)
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
