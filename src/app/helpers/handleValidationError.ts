/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from 'http-status-codes';

export const handleValidationError = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => {
    return {
      path: el.path,
      message: el.message,
    };
  });
  const errorMessages = errors.map((e) => e.message).join(', ');
  const message = `Validation failed: ${errorMessages}`;
  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message,
    errors,
  };
};