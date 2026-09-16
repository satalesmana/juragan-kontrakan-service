import { defineHandler, readBody } from 'h3'
import { sendSuccess, sendError } from '../../utils/response'
import { InvoiceService } from '../../services/InvoiceService'
import { generateInvoiceSchema } from '../../schemas/invoice'
import { requireAuth } from '../../middleware/auth'
import { ValidationError, UnauthorizedError, ForbiddenError } from '../../utils/errors'

const service = new InvoiceService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const body = await readBody(event)
    const parsed = generateInvoiceSchema.safeParse(body)

    if (!parsed.success) {
      const details: Record<string, string> = {}
      for (const err of parsed.error.issues) {
        details[err.path.join('.')] = err.message
      }
      return sendError(event, new ValidationError(details))
    }

    const result = await service.generateInvoices(user.id, parsed.data)
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
