import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyToken } from '../utils/jwt.js';
import AppError from '../errorHelpers/AppError.js';

export enum Role {
  RIDER = 'Rider',
  DRIVER = 'Driver',
  ADMIN = 'Admin',
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

      const decoded = verifyToken(token, process.env.JWT_SECRET!);

      if (!decoded || typeof decoded === 'string') {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid token');
      }

      // Check role authorization
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role as Role)) {
        throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized to access this resource');
      }

      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};