/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from 'http-status-codes';

export const handleCastError = (err: any) => {
  const regex = /"([^"]+)"/;
  const match = err.message.match(regex);
  const extractedValue = match ? match[1] : err.value;
  const message = `Invalid value ${extractedValue} for field ${err.path}`;
  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message,
  };
};