import { defineHandler, readBody, getRouterParam } from 'h3'
import { sendSuccess, sendError } from '../../../utils/response'
import { InvoiceService } from '../../../services/InvoiceService'
import { updateInvoiceSchema } from '../../../schemas/invoice'
import { requireAuth } from '../../../middleware/auth'
import { NotFoundError, ValidationError, UnauthorizedError, ForbiddenError } from '../../../utils/errors'

const service = new InvoiceService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) return sendError(event, new NotFoundError('Invoice'))

    const body = await readBody(event)
    const parsed = updateInvoiceSchema.safeParse(body)
    if (!parsed.success) {
      const details: Record<string, string> = {}
      for (const err of parsed.error.issues) {
        details[err.path.join('.')] = err.message
      }
      return sendError(event, new ValidationError(details))
    }

    const result = await service.updateInvoice(id, user.id, parsed.data)
    if (!result) return sendError(event, new NotFoundError('Invoice'))

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
