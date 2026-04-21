// Re-export commonly used types
export type { IAuthUser } from '../middlewares/checkAuth.middleware.js';
export type { IApiResponse } from '../utils/response.utils.js';

// JWT Payload structure
export interface IJwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Auth response structure
export interface IAuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: Record<string, unknown>;
    accessToken?: string;
    refreshToken?: string;
  };
  meta?: Record<string, unknown>;
}

// Pagination meta
export interface IPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPage?: number;
}

// API Error response
export interface IErrorResponse {
  statusCode: number;
  success: boolean;
  message: string;
  stack?: string;
}