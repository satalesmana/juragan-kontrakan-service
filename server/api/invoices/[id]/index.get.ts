import { defineHandler, getRouterParam } from 'h3'
import { sendSuccess, sendError } from '../../../utils/response'
import { InvoiceService } from '../../../services/InvoiceService'
import { requireAuth } from '../../../middleware/auth'
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../../../utils/errors'

const service = new InvoiceService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) return sendError(event, new NotFoundError('Invoice'))

    const invoice = await service.getInvoiceById(id, user.id)
    if (!invoice) return sendError(event, new NotFoundError('Invoice'))

    return sendSuccess(event, invoice)
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
