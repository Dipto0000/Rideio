import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import env from '../config/env.js';
import AppError from '../errorHelpers/AppError.js';
import { generateToken, verifyToken } from './jwt.js';

export interface IUserTokens {
  accessToken: string;
  refreshToken: string;
}

export const createUserTokens = (
  userId: string,
  email: string,
  role: string
): IUserTokens => {
  const jwtPayload = {
    userId,
    email,
    role,
  };

  const accessToken = generateToken(
    jwtPayload,
    env.JWT_SECRET,
    env.JWT_EXPIRY
  );

  const refreshToken = generateToken(
    jwtPayload,
    env.REFRESH_SECRET,
    env.REFRESH_EXPIRY
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const createNewAccessTokenWithRefreshToken = async (
  refreshToken: string
): Promise<string> => {
  const verifiedRefreshToken = verifyToken(
    refreshToken,
    env.REFRESH_SECRET
  ) as JwtPayload;

  if (!verifiedRefreshToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  const accessToken = generateToken(
    verifiedRefreshToken,
    env.JWT_SECRET,
    env.JWT_EXPIRY
  );

  return accessToken;
};