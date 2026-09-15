export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: Record<string, unknown>
  public readonly isOperational = true

  constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, string>) {
    super(422, 'VALIDATION_ERROR', 'Invalid request', details)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(409, 'CONFLICT', message)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message)
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(400, 'BUSINESS_RULE_ERROR', message)
  }
}

export function toAppResponse(error: AppError, env: string) {
  const exposeStack = env === 'development'
  return {
    success: false,
    error: {
      code: error.code,
      message: exposeStack ? error.message : (error.isOperational ? error.message : 'Internal server error'),
      ...(error.details ? { details: error.details } : {}),
      ...(exposeStack ? { stack: error.stack } : {}),
    },
  }
}
