/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from 'http-status-codes';

export const handleCastError = (err: any) => {
  const regex = /"([^"]+)"/;
  const match = err.message.match(regex);
  const extractedValue = match ? match[1] : err.value;
  const message = 'Invalid request. Please check your input and try again.';
  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message,
  };
};