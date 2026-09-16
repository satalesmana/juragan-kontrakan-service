import { defineHandler, readBody } from 'h3'
import { sendSuccess, sendError } from '../../utils/response'
import { ValidationError, UnauthorizedError, ConflictError, ForbiddenError, NotFoundError } from '../../utils/errors'
import { ContractService } from '../../services/ContractService'
import { contractSchema } from '../../schemas/contract'
import { requireAuth } from '../../middleware/auth'

const service = new ContractService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const body = await readBody(event)
    const parsed = contractSchema.safeParse(body)

    if (!parsed.success) {
      const details: Record<string, string> = {}
      for (const err of parsed.error.issues) {
        details[err.path.join('.')] = err.message
      }
      return sendError(event, new ValidationError(details))
    }
    
    const result = await service.createContract(user.id, parsed.data)
    return sendSuccess(event, result, undefined, 201)
  } catch (error: any) {
    if (error.message === 'Overlapping active contracts') {
      return sendError(event, new ConflictError('Room already has an active contract for this period'))
    }
    if (error.message === 'Unauthorized property access') {
      return sendError(event, new ForbiddenError('Unauthorized property access'))
    }
    if (error.message === 'Property not found' || error.message === 'Tenant not found' || error.message === 'Invalid room') {
      return sendError(event, new NotFoundError(error.message))
    }
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return sendError(event, new UnauthorizedError())
    }
    throw error
  }
})
