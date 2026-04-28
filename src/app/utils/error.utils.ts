import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createAppError = (
  statusCode: number,
  message?: string
): AppError => {
  if (message) {
    return new AppError(statusCode, message);
  }
  // Fallback phrase from StatusCodes
  const phrase = StatusCodes[statusCode as unknown as keyof typeof StatusCodes];
  return new AppError(
    statusCode,
    typeof phrase === 'string' ? phrase : 'Unknown error'
  );
};