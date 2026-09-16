import { defineHandler, getRouterParam, readBody } from 'h3'
import { sendSuccess, sendError } from '../../../../../utils/response'
import { PaymentService } from '../../../../../services/PaymentService'
import { updatePaymentSchema } from '../../../../../schemas/payment'
import { requireAuth } from '../../../../../middleware/auth'
import { NotFoundError, ValidationError, UnauthorizedError, ForbiddenError, ConflictError } from '../../../../../utils/errors'

const service = new PaymentService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const invoiceId = getRouterParam(event, 'invoiceId')
    const id = getRouterParam(event, 'id')
    if (!invoiceId || !id) return sendError(event, new NotFoundError('Payment'))

    const body = await readBody(event)
    const parsed = updatePaymentSchema.safeParse(body)

    if (!parsed.success) {
      const details: Record<string, string> = {}
      for (const err of parsed.error.issues) {
        details[err.path.join('.')] = err.message
      }
      return sendError(event, new ValidationError(details))
    }

    const result = await service.updatePayment(id, invoiceId, user.id, parsed.data)
    return sendSuccess(event, result)
  } catch (error: any) {
    if (error.message === 'Payment not found') {
      return sendError(event, new NotFoundError('Payment'))
    }
    if (error.message === 'Cannot update payment for cancelled invoice') {
      return sendError(event, new ForbiddenError('Cannot update payment for cancelled invoice'))
    }
    if (error.message === 'Payment exceeds outstanding amount') {
      return sendError(event, new ConflictError('Payment amount exceeds outstanding amount'))
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
