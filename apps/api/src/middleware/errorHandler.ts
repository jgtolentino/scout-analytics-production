import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { 
  StandardErrorResponse, 
  ErrorCodes, 
  HttpStatusCodes,
  TypeAlignmentValidator 
} from '@scout/validation'
import { logger } from '../utils/logger'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.headers['x-request-id'] as string || crypto.randomUUID()
  
  // Log error with context
  logger.error('Request error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    requestId,
    body: req.body,
    query: req.query
  })

  // Handle different error types
  if (error instanceof AppError) {
    return res.status(error.statusCode).json(
      TypeAlignmentValidator.createErrorResponse(
        error.code,
        error.message,
        error.details,
        requestId
      )
    )
  }

  // Validation errors (Zod)
  if (error instanceof ZodError) {
    return res.status(HttpStatusCodes.VALIDATION_ERROR).json(
      TypeAlignmentValidator.createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Validation failed',
        error.errors,
        requestId
      )
    )
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    let statusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR
    let code = ErrorCodes.DATABASE_ERROR
    let message = 'Database operation failed'

    switch (error.code) {
      case 'P2002':
        statusCode = HttpStatusCodes.CONFLICT
        code = ErrorCodes.DUPLICATE_RECORD
        message = 'Record already exists'
        break
      case 'P2025':
        statusCode = HttpStatusCodes.NOT_FOUND
        code = ErrorCodes.RECORD_NOT_FOUND
        message = 'Record not found'
        break
      case 'P2003':
        statusCode = HttpStatusCodes.BAD_REQUEST
        code = ErrorCodes.CONSTRAINT_VIOLATION
        message = 'Foreign key constraint violation'
        break
    }

    return res.status(statusCode).json(
      TypeAlignmentValidator.createErrorResponse(
        code,
        message,
        { prismaCode: error.code, meta: error.meta },
        requestId
      )
    )
  }

  // Default server error
  res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
    TypeAlignmentValidator.createErrorResponse(
      ErrorCodes.UNKNOWN_ERROR,
      'Internal server error',
      undefined,
      requestId
    )
  )
}

// Request ID middleware
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || crypto.randomUUID()
  req.headers['x-request-id'] = requestId
  res.setHeader('X-Request-ID', requestId)
  next()
}

// Response standardization middleware
export const responseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json
  
  res.json = function(data: any) {
    const requestId = req.headers['x-request-id'] as string
    
    // If data is already in standard format, return as-is
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson.call(this, data)
    }
    
    // Wrap in standard success response
    const standardResponse = TypeAlignmentValidator.createSuccessResponse(
      data,
      { timestamp: new Date().toISOString(), requestId },
      requestId
    )
    
    return originalJson.call(this, standardResponse)
  }
  
  next()
}
