import { defineHandler, readBody } from 'h3'
import { sendSuccess, sendError } from '../../utils/response'
import { UnauthorizedError } from '../../utils/errors'
import { AuthService } from '../../services/AuthService'

const service = new AuthService()

export default defineHandler(async (event) => {
  const body = await readBody(event)
  const { refreshToken } = body

  if (!refreshToken) {
    return sendError(event, new UnauthorizedError('Refresh token required'))
  }

  try {
    const tokens = await service.refreshToken(refreshToken)
    return sendSuccess(event, tokens)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Invalid refresh token') {
      return sendError(event, new UnauthorizedError('Invalid or expired refresh token'))
    }
    throw error
  }
})
