import { Response } from 'express';
import { TErrorSources } from '../interfaces/error.types.js';

export interface IApiResponse<T = unknown> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
  errorSources?: TErrorSources[];
}

export const sendResponse = <T = unknown>(
  res: Response,
  options: IApiResponse<T>
): void => {
  res.status(options.statusCode).json({
    success: options.success,
    message: options.message,
    ...(options.data !== undefined && { data: options.data }),
    ...(options.meta !== undefined && { meta: options.meta }),
    ...(options.errorSources !== undefined && { errorSources: options.errorSources }),
  });
};