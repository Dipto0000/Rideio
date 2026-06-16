import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { envVars } from './app/config/env.js';
import { StatusCodes } from 'http-status-codes';
import routes from './app/routes/index.js';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler.js';
import notFound from './app/middlewares/notFound.js';
import { sendResponse } from './app/utils/sendResponse.js';
import { SubscriptionServices } from './app/modules/subscription/subscription.service.js';
import { seedSuperAdmin } from './app/utils/seed-super-admin.js';

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

// ──────────────────────────────────────────────
// Lazy MongoDB connection (required for Vercel serverless — server.ts never runs there)
// In local dev, server.ts connects before listen(), so this is a no-op on warm instances.
// ──────────────────────────────────────────────
let isConnected = false;
let isSeeded = false;

app.use(async (_req, _res, next) => {
  if (!isConnected) {
    try {
      await mongoose.connect(envVars.DB_URL);
      isConnected = true;
      console.log('✅ MongoDB connected via lazy middleware');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
    }
  }

  // Fire-and-forget seeds — run once after the first successful connection
  if (isConnected && !isSeeded) {
    isSeeded = true;
    SubscriptionServices.seedDefaultPlan()
      .then(() => console.log('✅ Subscription plan seeded (lazy)'))
      .catch((err) => console.error('❌ Subscription seed failed:', err));

    seedSuperAdmin()
      .then(() => console.log('✅ Super admin seeded (lazy)'))
      .catch((err) => console.error('❌ Super admin seed failed:', err));
  }

  next();
});

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