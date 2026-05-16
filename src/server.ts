import mongoose from 'mongoose';
import app from './app.js';
import { envVars } from './app/config/env.js';
import { SubscriptionServices } from './app/modules/subscription/subscription.service.js';
import { seedSuperAdmin } from './app/utils/seed-super-admin.js';

const SHUTDOWN_TIMEOUT = 10_000; // 10 seconds
let server: ReturnType<typeof app.listen> | null = null;

const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // Force exit after timeout
  const forceExit = setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
      } catch (error) {
        console.error('MongoDB close error:', error);
      }
      clearTimeout(forceExit);
      process.exit(0);
    });
  } else {
    clearTimeout(forceExit);
    process.exit(0);
  }
};

const connectDatabase = async () => {
  try {
    await mongoose.connect(envVars.DB_URL);
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  await connectDatabase();

  // Start listening immediately so the server is available
  server = app.listen(envVars.PORT, () => {
    console.log(`🚀 Server is running on port ${envVars.PORT} in ${envVars.NODE_ENV} mode`);
  });

  // Fire-and-forget seeds — run in background after server is up
  // 1. Seed default subscription plan (700 BDT/month driver plan)
  SubscriptionServices.seedDefaultPlan()
    .then(() => console.log('✅ Subscription plan seeded'))
    .catch((err) => console.error('❌ Subscription seed failed:', err));

  // 2. Seed super admin from env vars (runs only if SUPER_ADMIN_EMAIL/PASSWORD are set)
  seedSuperAdmin()
    .then(() => console.log('✅ Super admin seed complete'))
    .catch((err) => console.error('❌ Super admin seed failed:', err));
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Boot
(async () => {
  try {
    await startServer();
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();