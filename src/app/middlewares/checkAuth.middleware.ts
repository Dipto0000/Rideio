import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyToken } from '../utils/jwt.utils.js';
import { AppError } from '../utils/error.utils.js';

export interface IAuthUser {
  userId: string;
  email: string;
  role: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}

export const checkAuth = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'No token provided');
      }

      const token = authHeader.split(' ')[1];

      if (!token) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'No token provided');
      }

      const decoded = verifyToken<IAuthUser>(token, process.env.JWT_SECRET!);

      if (!decoded) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid token');
      }

      // Check role authorization
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized to access this resource');
      }

      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};