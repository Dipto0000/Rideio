/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from 'http-status-codes';

export const handleDuplicateError = (err: any) => {
  const regex = /"([^"]+)"/;
  const match = err.message.match(regex);
  const extractedValue = match ? match[1] : null;
  const message = `Duplicate field value: ${extractedValue}. Please use another value!`;
  return {
    statusCode: StatusCodes.CONFLICT,
    message,
  };
};