import { defineHandler, getRouterParam } from 'h3'
import { sendSuccess, sendError } from '../../../../../utils/response'
import { PaymentService } from '../../../../../services/PaymentService'
import { requireAuth } from '../../../../../middleware/auth'
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../../../../../utils/errors'

const service = new PaymentService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const invoiceId = getRouterParam(event, 'invoiceId')
    const id = getRouterParam(event, 'id')
    if (!invoiceId || !id) return sendError(event, new NotFoundError('Payment'))

    const payment = await service.getPaymentById(id, invoiceId)
    if (!payment) return sendError(event, new NotFoundError('Payment'))

    return sendSuccess(event, payment)
  } catch (error: any) {
    if (error.message === 'Payment not found') {
      return sendError(event, new NotFoundError('Payment'))
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
