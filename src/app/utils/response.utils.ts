import { Response, Request, NextFunction, RequestHandler } from 'express';

export interface IApiResponse<T = unknown> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
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
  });
};

export type AsyncFunction<T = unknown> = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<T>;

export const catchAsync = <T = unknown>(
  fn: AsyncFunction<T>
): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};