/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from 'http-status-codes';

export const handleDuplicateError = (err: any) => {
  const regex = /"([^"]+)"/;
  const match = err.message.match(regex);
  const extractedValue = match ? match[1] : null;
  const fieldName = err.message.includes('email') ? 'email' : err.message.includes('phone') ? 'phone number' : 'value';
  const message = extractedValue
    ? `This ${fieldName} is already taken. Please use a different ${fieldName}.`
    : 'This information is already registered. Please try a different value.';
  return {
    statusCode: StatusCodes.CONFLICT,
    message,
  };
};