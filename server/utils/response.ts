import type { H3Event } from 'h3'
import { AppError } from './errors'

interface SuccessMeta {
  page?: number
  limit?: number
  total?: number
  totalPages?: number
  [key: string]: unknown
}

export function sendSuccess(event: H3Event, data: unknown, meta?: SuccessMeta, statusCode = 200) {
  const response: Record<string, unknown> = { success: true, data }
  if (meta) response.meta = meta
  if (event.node?.res) {
    event.node.res.statusCode = statusCode
  }
  return response
}

export function sendPaginated(
  event: H3Event,
  items: unknown[],
  page: number,
  limit: number,
  total: number,
) {
  return sendSuccess(event, items, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  })
}

export function sendError(event: H3Event, error: AppError) {
  if (event.res) {
    event.res.status = error.statusCode
  }
  
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    },
  }
}
