/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from 'http-status-codes';

export const handleZodError = (err: any) => {
  const errors = err.issues.map((issue: any) => {
    return {
      path: issue.path.join('.'),
      message: issue.message,
    };
  });
  const errorMessages = errors.map((e: { message: any; }) => e.message).join(', ');
  const message = `Validation failed: ${errorMessages}`;
  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message,
    errors,
  };
};