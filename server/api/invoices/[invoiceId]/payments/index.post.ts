import { defineHandler, getRouterParam, readBody } from 'h3'
import { sendSuccess, sendError } from '../../../../utils/response'
import { PaymentService } from '../../../../services/PaymentService'
import { paymentSchema } from '../../../../schemas/payment'
import { requireAuth } from '../../../../middleware/auth'
import { NotFoundError, ValidationError, UnauthorizedError, ForbiddenError, ConflictError } from '../../../../utils/errors'

const service = new PaymentService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const invoiceId = getRouterParam(event, 'invoiceId')
    if (!invoiceId) return sendError(event, new NotFoundError('Invoice'))

    const body = await readBody(event)
    const parsed = paymentSchema.safeParse(body)

    if (!parsed.success) {
      const details: Record<string, string> = {}
      for (const err of parsed.error.issues) {
        details[err.path.join('.')] = err.message
      }
      return sendError(event, new ValidationError(details))
    }

    const result = await service.createPayment(invoiceId, user.id, parsed.data)
    return sendSuccess(event, result, undefined, 201)
  } catch (error: any) {
    if (error.message === 'Invoice not found') {
      return sendError(event, new NotFoundError('Invoice'))
    }
    if (error.message === 'Cannot pay cancelled invoice') {
      return sendError(event, new ForbiddenError('Cannot pay cancelled invoice'))
    }
    if (error.message === 'Payment exceeds outstanding amount') {
      return sendError(event, new ConflictError('Payment amount exceeds outstanding amount'))
    }
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return sendError(event, new UnauthorizedError())
    }
    throw error
  }
})
