import { Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';

export const validateRequest = (schema: z.ZodType) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};