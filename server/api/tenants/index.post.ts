import { defineHandler, readBody } from 'h3'
import { sendSuccess, sendError } from '../../utils/response'
import { ValidationError, UnauthorizedError } from '../../utils/errors'
import { TenantService } from '../../services/TenantService'
import { tenantSchema } from '../../schemas/tenant'
import { requireAuth } from '../../middleware/auth'

const service = new TenantService()

export default defineHandler(async (event) => {
  try {
    requireAuth(event)
    const body = await readBody(event)
    const parsed = tenantSchema.safeParse(body)

    if (!parsed.success) {
      const details: Record<string, string> = {}
      for (const err of parsed.error.issues) {
        details[err.path.join('.')] = err.message
      }
      return sendError(event, new ValidationError(details))
    }

    const result = await service.createTenant(parsed.data)
    return sendSuccess(event, result, undefined, 201)
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return sendError(event, new UnauthorizedError())
    }
    throw error
  }
})
