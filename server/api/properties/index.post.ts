import { defineHandler, readBody } from 'h3'
import { sendSuccess, sendError } from '../../utils/response'
import { ValidationError } from '../../utils/errors'
import { PropertyService } from '../../services/PropertyService'
import { propertySchema } from '../../schemas/property'

const service = new PropertyService()

export default defineHandler(async (event) => {
    const body = await readBody(event)
    const parsed = propertySchema.safeParse(body)
    if (!parsed.success) {
        const details: Record<string, string> = {}
        for (const err of parsed.error.errors) {
            details[err.path.join('.')] = err.message
        }
        return sendError(event, new ValidationError(details))
    }
    const result = await service.create(parsed.data)
    return sendSuccess(event, result, undefined, 201)
})