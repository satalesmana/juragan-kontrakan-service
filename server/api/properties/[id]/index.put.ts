import { defineHandler, readBody, getRouterParam } from 'h3'
import { sendSuccess, sendError } from '../../../utils/response'
import { ValidationError,  NotFoundError } from '../../../utils/errors'
import { PropertyService } from '../../../services/PropertyService'
import { updatePropertySchema } from '../../../schemas/property'

const service = new PropertyService()

export default defineHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        return sendError(event, new NotFoundError('Property'))
    }
    
    const body = await readBody(event)
    const parsed = updatePropertySchema.safeParse(body)
    if (!parsed.success) {
        const details: Record<string, string> = {}
        for (const err of parsed.error.errors) {
        details[err.path.join('.')] = err.message
        }
        return sendError(event, new ValidationError(details))
    }

    const result = await service.update(id, parsed.data)
    if (!result) return sendError(event, new NotFoundError('Property'))
        
    return sendSuccess(event, result)
})