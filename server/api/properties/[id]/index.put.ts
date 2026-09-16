import { defineHandler, readBody, getRouterParam } from 'h3'
import { sendSuccess, sendError } from '../../../utils/response'
import { ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from '../../../utils/errors'
import { PropertyService } from '../../../services/PropertyService'
import { updatePropertySchema } from '../../../schemas/property'
import { requireAuth } from '../../../middleware/auth'

const service = new PropertyService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) {
      return sendError(event, new NotFoundError('Property'))
    }

    const body = await readBody(event)
    const parsed = updatePropertySchema.safeParse(body)
    if (!parsed.success) {
      const details: Record<string, string> = {}
      for (const err of parsed.error.issues) {
        details[err.path.join('.')] = err.message
      }
      return sendError(event, new ValidationError(details))
    }

    const result = await service.updateProperty(id, user.id, parsed.data)
    if (!result) return sendError(event, new NotFoundError('Property'))

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
