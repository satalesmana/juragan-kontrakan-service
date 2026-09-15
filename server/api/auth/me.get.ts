import { defineHandler } from 'h3'
import { sendSuccess, sendError } from '../../utils/response'
import { UnauthorizedError } from '../../utils/errors'
import { AuthService } from '../../services/AuthService'
import { requireAuth } from '../../middleware/auth'

const service = new AuthService()

export default defineHandler(async (event) => {
  const user = requireAuth(event)
  const currentUser = await service.getUserById(user.id)
  if (!currentUser) {
    return sendError(event, new UnauthorizedError())
  }
  return sendSuccess(event, currentUser)
})
