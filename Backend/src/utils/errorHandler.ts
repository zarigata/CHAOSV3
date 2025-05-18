// ==========================================================
// ⚠️ C.H.A.O.S. ERROR HANDLING SYSTEM ⚠️
// ==========================================================
// █▀█ █▀█ █░█ █▀▄ █▀█ █▀▄ █▀ █░█ █▀█   █▀▄ █▐█ █▀▀ █▀▀ █▀▄ █▀█
// ▄█▄ █▄█ █▄█ █▀▄ █▀▄ █▀▄ ▄█ █▄█ █▀▄   █▀▄ ░█░ █▄▄ █▄▄ █▀▄ █▀▄
// ==========================================================
// [CODEX-1337] CENTRALIZED ERROR HANDLING FOR FASTIFY REQUESTS
// [CODEX-1337] FORMATS ERROR RESPONSES WITH CONSISTENT STRUCTURE
// [CODEX-1337] HANDLES VARIOUS ERROR TYPES (VALIDATION, DB, AUTH, ETC)
// [CODEX-1337] PROVIDES DETAILED LOGGING FOR TROUBLESHOOTING
// [CODEX-1337] SANITIZES SENSITIVE DATA BEFORE SENDING RESPONSES
// ==========================================================

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from './logger';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Error handler for Fastify
export const errorHandler = (
  error: FastifyError, 
  request: FastifyRequest, 
  reply: FastifyReply
) => {
  // Get the request path for better logging
  const requestPath = request.url;
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    logger.warn({ path: requestPath, error: error.format() }, 'Validation error');
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation error',
      details: error.format(),
    });
  }
  
  // Handle Prisma database errors
  if (error instanceof PrismaClientKnownRequestError) {
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      const field = (error.meta?.target as string[]) || ['Unknown field'];
      logger.warn({ path: requestPath, field }, 'Unique constraint violation');
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: `A record with this ${field.join(', ')} already exists`,
      });
    }
    
    // Handle not found errors
    if (error.code === 'P2025') {
      logger.warn({ path: requestPath, error: error.message }, 'Record not found');
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'The requested resource was not found',
      });
    }
    
    // Log other database errors
    logger.error({ path: requestPath, code: error.code, error: error.message }, 'Database error');
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'A database error occurred',
    });
  }
  
  // Handle JWT authentication errors
  if (error.statusCode === 401) {
    logger.warn({ path: requestPath }, 'Authentication error');
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: error.message || 'Authentication required',
    });
  }
  
  // Log all other errors
  logger.error({ 
    path: requestPath, 
    statusCode: error.statusCode, 
    message: error.message,
    stack: error.stack 
  }, 'Unhandled error');
  
  // Return appropriate error response
  const statusCode = error.statusCode || 500;
  
  return reply.status(statusCode).send({
    statusCode,
    error: error.name || 'Internal Server Error',
    message: statusCode === 500 
      ? 'An unexpected error occurred' 
      : error.message || 'Something went wrong',
  });
};
