import { defineHandler, getQuery } from 'h3'
import { sendSuccess, sendError } from '../../utils/response'
import { TenantService } from '../../services/TenantService'
import { requireAuth } from '../../middleware/auth'
import { UnauthorizedError } from '../../utils/errors'

const service = new TenantService()

export default defineHandler(async (event) => {
  try {
    requireAuth(event)
    const query = getQuery(event)
    const page = Math.max(1, parseInt(String(query.page ?? 1), 10))
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20), 10)))
    const search = typeof query.search === 'string' ? query.search : undefined

    const result = await service.getTenants(page, limit, search)
    return sendSuccess(event, result.tenants, {
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
