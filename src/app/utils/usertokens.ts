import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { envVars } from '../config/env.js';
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
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES
  );

  const refreshToken = generateToken(
    jwtPayload,
    envVars.JWT_REFRESH_SECRET,
    envVars.JWT_REFRESH_EXPIRES
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
    envVars.JWT_REFRESH_SECRET
  ) as JwtPayload;

  if (!verifiedRefreshToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  const accessToken = generateToken(
    verifiedRefreshToken,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES
  );

  return accessToken;
};