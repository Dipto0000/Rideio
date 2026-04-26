import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './app/routes/index.js';
import env from './app/config/env.js';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler.middleware.js';
import { AppError } from './app/utils/error.utils.js';
import { sendResponse } from './app/utils/response.utils.js';
import { StatusCodes } from 'http-status-codes';

const app = express();

// Global middleware
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check route
app.get('/health', (_req, res) => {
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Server is healthy',
    data: { timestamp: new Date().toISOString() },
  });
});

// API routes
app.use('/api/v1', routes);

// 404 handler — must be before globalErrorHandler
app.use((_req, _res, next) => {
  next(new AppError(StatusCodes.NOT_FOUND, 'Route not found'));
});

// Global error handler — must be last
app.use(globalErrorHandler);

export default app;