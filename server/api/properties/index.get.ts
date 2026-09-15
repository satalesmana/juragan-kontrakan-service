import { defineHandler, getQuery, readBody, getRouterParam } from 'h3'
import { sendSuccess } from '../../utils/response'
import { PropertyService } from '../../services/PropertyService'

const service = new PropertyService()

export default defineHandler(async (event) => {
    const query = getQuery(event)
    const page = Math.max(1, parseInt(String(query.page ?? 1), 10))
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20), 10)))
    const search = typeof query.search === 'string' ? query.search : undefined

    const result = await service.list(page, limit, search)
    return sendSuccess(event, result.properties, {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
    })
})