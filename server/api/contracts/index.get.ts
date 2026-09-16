import { defineHandler, getQuery } from 'h3'
import { sendSuccess, sendError } from '../../utils/response'
import { ContractService } from '../../services/ContractService'
import { requireAuth } from '../../middleware/auth'
import { UnauthorizedError } from '../../utils/errors'

const service = new ContractService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const query = getQuery(event)
    const page = Math.max(1, parseInt(String(query.page ?? 1), 10))
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20), 10)))
    const status = typeof query.status === 'string' ? query.status : undefined

    const result = await service.getContracts(user.id, page, limit, status)
    return sendSuccess(event, result.contracts, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit)
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return sendError(event, new UnauthorizedError())
    }
    throw error
  }
})
