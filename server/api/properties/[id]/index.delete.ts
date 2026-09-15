import { defineHandler, getRouterParam } from 'h3'
import { sendSuccess, sendError } from '../../../utils/response'
import { NotFoundError } from '../../../utils/errors'
import { PropertyService } from '../../../services/PropertyService'

const service = new PropertyService()

export default defineHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        return sendError(event, new NotFoundError('Property'))
    }
    
    const deleted = await service.delete(id)
    if (!deleted) return sendError(event, new NotFoundError('Property'))
    return sendSuccess(event, { deleted: true })
})