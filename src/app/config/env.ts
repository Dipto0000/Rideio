import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // JWT
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRY: z.string().default('15m'),
  REFRESH_SECRET: z.string().min(1, 'REFRESH_SECRET is required'),
  REFRESH_EXPIRY: z.string().default('7d'),

  // Security
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),

  // CORS & URLs
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const env = envSchema.parse({
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY,
  REFRESH_SECRET: process.env.REFRESH_SECRET,
  REFRESH_EXPIRY: process.env.REFRESH_EXPIRY,
  BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS,
  FRONTEND_URL: process.env.FRONTEND_URL,
});

export default env;
