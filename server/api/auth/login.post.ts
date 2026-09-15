import { defineHandler, readBody } from 'h3'
import { sendSuccess, sendError } from '../../utils/response'
import { ValidationError } from '../../utils/errors'
import { AuthService } from '../../services/AuthService'
import { loginSchema } from '../../schemas/auth'

const service = new AuthService()

export default defineHandler(async (event) => {
  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    const details: Record<string, string> = {}
    for (const err of parsed.error.issues) {
      details[err.path.join('.')] = err.message
    }
    return sendError(event, new ValidationError(details))
  }

  try {
    const result = await service.login(parsed.data)
    return sendSuccess(event, result)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Invalid credentials') {
      return sendError(event, new ValidationError({ email: 'Email atau password salah' }))
    }
    throw error
  }
})
