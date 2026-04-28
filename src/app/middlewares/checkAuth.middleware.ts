import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyToken } from '../utils/jwt.utils.js';
import { AppError } from '../utils/error.utils.js';
import { Role } from '../modules/auth/auth.interface.js';

export interface IAuthUser {
  userId: string;
  email: string;
  role: Role;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}

/**
 * checkAuth middleware - Next.js compatible
 * Reads token from:
 * 1. Authorization header: "Bearer <token>"
 * 2. Cookie: "accessToken"
 * 3. Cookie: "refreshToken" (for refresh endpoint)
 */
export const checkAuth = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      let token: string | undefined;

      // 1. Try Authorization header first
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }

      // 2. Try accessToken cookie
      if (!token) {
        token = req.cookies?.accessToken as string | undefined;
      }

      // 3. Try refreshToken cookie (for token refresh)
      if (!token) {
        token = req.cookies?.refreshToken as string | undefined;
      }

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