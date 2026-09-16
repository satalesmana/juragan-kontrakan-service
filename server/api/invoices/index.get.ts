import { defineHandler, getQuery } from 'h3'
import { sendSuccess, sendError } from '../../utils/response'
import { InvoiceService } from '../../services/InvoiceService'
import { requireAuth } from '../../middleware/auth'
import { UnauthorizedError } from '../../utils/errors'

const service = new InvoiceService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const query = getQuery(event)

    const result = await service.getInvoices(user.id, {
      propertyId: query.propertyId,
      tenantId: query.tenantId,
      roomId: query.roomId,
      contractId: query.contractId,
      billingPeriod: query.billingPeriod,
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      search: query.search,
      page: parseInt(query.page as string) || 1,
      limit: parseInt(query.limit as string) || 20
    })

    return sendSuccess(event, result.invoices, {
      page: result.page || 1,
      limit: result.limit || 20,
      total: result.total,
      totalPages: Math.ceil(result.total / (result.limit || 20))
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return sendError(event, new UnauthorizedError())
    }
    throw error
  }
})
