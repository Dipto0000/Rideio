/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import AppError from '../errorHelpers/AppError.js';
import { sendResponse } from '../utils/sendResponse.js';
import { handleCastError } from '../helpers/handleCastError.js';
import { handleDuplicateError } from '../helpers/handleDuplicateError.js';
import { handleValidationError } from '../helpers/handleValidationError.js';
import { handleZodError } from '../helpers/handleZodError.js';

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong!';
  let errorSources: { path: string; message: string }[] = [];

  // Duplicate error (E11000)
  if (err.code === 11000) {
    const simplifiedError = handleDuplicateError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  }
  // Cast Error (invalid ObjectId)
  else if (err.name === 'CastError') {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  }
  // Zod Error
  else if (err.name === 'ZodError') {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errors;
  }
  // Mongoose Validation Error
  else if (err.name === 'ValidationError') {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errors;
  }
  // Custom AppError
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Native Error
  else if (err instanceof Error) {
    message = err.message;
  }

  sendResponse(res, {
    statusCode,
    success: false,
    message,
    data: null,
    errorSources,
  });
};