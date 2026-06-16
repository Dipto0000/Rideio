// Vercel serverless function entry point
// @vercel/node uses esbuild under the hood, which resolves .js → .ts and bundles
// everything into a single serverless function — no need for pre-compiled dist/
import app from '../src/app.js';

export default app;
