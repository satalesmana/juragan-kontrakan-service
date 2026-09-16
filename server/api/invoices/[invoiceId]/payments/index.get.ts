import { defineHandler, getRouterParam } from 'h3'
import { sendSuccess, sendError } from '../../../../utils/response'
import { PaymentService } from '../../../../services/PaymentService'
import { requireAuth } from '../../../../middleware/auth'
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../../../../utils/errors'

const service = new PaymentService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const invoiceId = getRouterParam(event, 'invoiceId')
    if (!invoiceId) return sendError(event, new NotFoundError('Invoice'))

    // Verify invoice access
    await service.getPaymentsForInvoice(invoiceId)

    const payments = await service.getPaymentsForInvoice(invoiceId)
    return sendSuccess(event, payments)
  } catch (error: any) {
    if (error.message === 'Invoice not found') {
      return sendError(event, new NotFoundError('Invoice'))
    }
    if (error.message === 'Unauthorized payment access') {
      return sendError(event, new ForbiddenError('Unauthorized payment access'))
    }
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return sendError(event, new UnauthorizedError())
    }
    throw error
  }
})
