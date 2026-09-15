import type { H3Event } from 'h3'
import jwt from 'jsonwebtoken'

export interface UserContext {
  id: string
  email: string
  role: 'owner' | 'admin'
}

export function requireAuth(event: H3Event): UserContext {
  const authHeader = event.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string
      email: string
      role: 'owner' | 'admin'
    }
    event.context.user = payload
    return payload
  } catch {
    throw new Error('Invalid token')
  }
}

export function requireRole(role: 'owner' | 'admin') {
  return (event: H3Event): UserContext => {
    const user = requireAuth(event)
    if (user.role !== role) {
      throw new Error('Forbidden')
    }
    return user
  }
}

export default {
  requireAuth,
  requireRole,
}
