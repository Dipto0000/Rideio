import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { AppError } from '../utils/error.utils.js';
import { sendResponse } from '../utils/response.utils.js';

interface IError {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  message?: string;
  stack?: string;
}

export const globalErrorHandler = (
  err: IError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal server error';

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = Object.values(err.errors as Record<string, { message: string }>)
      .map((e) => e.message)
      .join('. ');
  }

  // Mongoose CastError (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key error
  if (err instanceof Error && 'code' in err && (err as { code: number }).code === 11000) {
    statusCode = StatusCodes.CONFLICT;
    message = 'Duplicate field value entered';
  }

  // Operational trusted errors
  if (err.isOperational) {
    sendResponse(res, {
      statusCode,
      success: false,
      message,
    });
    return;
  }

  // Programming or unknown errors — don't leak error details
  console.error('💥 GLOBAL ERROR HANDLER:', err);

  sendResponse(res, {
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    success: false,
    message: 'Internal server error',
  });
};