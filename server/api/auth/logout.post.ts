import { defineHandler } from 'h3'
import { sendSuccess } from '../../utils/response'
import { requireAuth } from '../../middleware/auth'

export default defineHandler(async (event) => {
  requireAuth(event)
  return sendSuccess(event, { message: 'Logged out successfully' })
})
