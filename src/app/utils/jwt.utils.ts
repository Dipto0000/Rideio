import jwt from 'jsonwebtoken';
import { IJwtPayload } from '../interfaces/index.js';

const ACCESS_EXPIRY = (process.env.JWT_EXPIRY || '15m') as string;
const REFRESH_EXPIRY = (process.env.REFRESH_EXPIRY || '7d') as string;

export const generateAccessToken = (payload: IJwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: ACCESS_EXPIRY,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (
  payload: Omit<IJwtPayload, 'role'>
): string => {
  return jwt.sign(payload, process.env.REFRESH_SECRET!, {
    expiresIn: REFRESH_EXPIRY,
  } as jwt.SignOptions);
};

export const verifyToken = <T = IJwtPayload>(token: string, secret: string): T => {
  return jwt.verify(token, secret) as T;
};

export const decodeToken = <T = IJwtPayload>(token: string): T | null => {
  return jwt.decode(token) as T | null;
};