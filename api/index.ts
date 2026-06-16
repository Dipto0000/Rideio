// Vercel serverless function entry point
// Vercel runs `npm run build` (tsc) first, which compiles src/app.ts → dist/app.js
// Then @vercel/node compiles this file and the import resolves correctly at runtime
import app from '../dist/app.js';

export default app;
