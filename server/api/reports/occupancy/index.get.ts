import { defineHandler, getQuery } from 'h3'
import { sendSuccess, sendError } from '../../../utils/response'
import { ReportService } from '../../../services/ReportService'
import { requireAuth } from '../../../middleware/auth'
import { UnauthorizedError } from '../../../utils/errors'

const service = new ReportService()

export default defineHandler(async (event) => {
  try {
    const user = requireAuth(event)
    const query = getQuery(event) as { propertyId?: string; year?: string }

    const propertyId = query.propertyId
    const year = query.year ? parseInt(query.year, 10) : undefined

    const report = await service.getOccupancyReport(propertyId, year)
    return sendSuccess(event, report)
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return sendError(event, new UnauthorizedError())
    }
    throw error
  }
})
