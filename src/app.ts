import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { envVars } from './app/config/env.js';
import { StatusCodes } from 'http-status-codes';
import routes from './app/routes/index.js';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler.js';
import notFound from './app/middlewares/notFound.js';
import { sendResponse } from './app/utils/sendResponse.js';

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({
  origin: envVars.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base Route/Root Path Message
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Rideio Backend API Pipeline Live Server!",
    version: "1.0.0"
  });
});

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
app.use(notFound)

// Global error handler — must be last
app.use(globalErrorHandler);

export default app;