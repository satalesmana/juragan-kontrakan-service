import { defineHandler, getQuery } from 'h3'
import { sendSuccess, sendError } from '../../../utils/response'
import { ReportService } from '../../../services/ReportService'
import { requireAuth } from '../../../middleware/auth'
import { UnauthorizedError } from '../../../utils/errors'

const service = new ReportService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const query = getQuery(event) as { propertyId?: string; year?: string; month?: string; dateFrom?: string; dateTo?: string; view?: string }

    const propertyId = query.propertyId
    const year = query.year ? parseInt(query.year, 10) : undefined
    const month = query.month ? parseInt(query.month, 10) : undefined

    if (query.view === 'monthly') {
      const monthlyData = await service.getMonthlyRevenueReport(propertyId, year)
      return sendSuccess(event, monthlyData)
    }

    const report = await service.getRevenueReport(propertyId, year, month, query.dateFrom, query.dateTo)
    return sendSuccess(event, report)
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return sendError(event, new UnauthorizedError())
    }
    throw error
  }
})
