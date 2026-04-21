# Rideio Backend — Handover Document

> Created: Session end
> Status: Foundation complete, Auth module next

---

## Project Overview

**Rideio** — A ride-sharing and donation platform built with Node.js + Express + TypeScript + MongoDB (Mongoose).
Architecture: Module-based (Controller-Service-Model). Feature-by-feature development, committed incrementally to Git.

---

## What Was Done

### Git Commits (2 total)

| Commit | Hash | Message |
|---|---|---|
| 1 | `61ee68c` | `feat: add foundation utilities and middleware for auth module` |
| 2 | `1420180` | `fix: add MongoDB connection and graceful shutdown to server.ts` |

### Files Created/Modified (17 total)

**Configuration:**
- `tsconfig.json` — `rootDir: src`, `outDir: dist`, `module: ESNext`, `moduleResolution: bundler`, strict
- `package.json` — scripts: `dev`, `build`, `start`; all dependencies installed
- `.env` — all required env vars defined (placeholder values)
- `.gitignore`

**Foundation Layer:**
- `src/app/utils/error.utils.ts` — `AppError` class + `createAppError` helper
- `src/app/utils/response.utils.ts` — `sendResponse` + `catchAsync` utilities
- `src/app/utils/jwt.utils.ts` — `generateAccessToken`, `generateRefreshToken`, `verifyToken`, `decodeToken`
- `src/app/middlewares/globalErrorHandler.middleware.ts` — handles Mongoose validation, CastError, duplicate key, operational errors
- `src/app/middlewares/validateRequest.middleware.ts` — Zod schema validation middleware
- `src/app/middlewares/checkAuth.middleware.ts` — JWT auth guard + role-based access (`checkAuth(Role.RIDER, Role.DRIVER)`)
- `src/app/interfaces/index.ts` — shared types: `IAuthUser`, `IJwtPayload`, `IApiResponse`, `IPaginationMeta`, `IErrorResponse`
- `src/app/config/env.ts` — Zod-validated env vars: PORT, MONGO_URI, NODE_ENV, JWT_SECRET, JWT_EXPIRY, REFRESH_SECRET, REFRESH_EXPIRY, BCRYPT_SALT_ROUNDS, FRONTEND_URL

**Server Bootstrap:**
- `src/server.ts` — MongoDB connection (before HTTP server), graceful shutdown (SIGTERM/SIGINT with 10s force-exit timeout), unhandled rejection/uncaught exception handlers
- `src/app.ts` — minimal placeholder (awaiting app.ts wiring — see What's Left below)

**Knowledge:**
- `knowledge.md` — full project documentation: architecture, patterns, coding style, env vars, cheat sheet

---

## What's Left

### High Priority — Core Modules

| # | Module | Files to Create | Description |
|---|---|---|---|
| 1 | **Auth Module** | 6 files in `src/app/modules/auth/` | Rider & Driver signup/login with separate role accounts, JWT access + refresh tokens, profile management |
| 2 | **Driver Module** | 6 files in `src/app/modules/driver/` | Driver profile (vehicle info, license, rating), subscription management (`isSubscribed`, `subscriptionExpires`) |
| 3 | **Ride Module** | 6 files in `src/app/modules/ride/` | Post ride requests, browse rides, accept/match logic, contact reveal only after mutual confirmation |
| 4 | **Subscription Module** | 6 files in `src/app/modules/subscription/` | Subscription plans, SSLCommerz payment integration, status update |

### Infrastructure — app.ts

| # | Task | Description |
|---|---|---|
| 5 | Wire `app.ts` | Add global middleware: cors, JSON parser, cookie-parser, express.json, routes (mounted under `/api/v1`), global error handler last |

### Route Registration

| # | Task | Description |
|---|---|---|
| 6 | Create `routes/index.ts` | Register all module routes in `moduleRoutes` array under `/api/v1` prefix |

### Nice-to-Have

| # | Task | Description |
|---|---|---|
| 7 | Create `.env.example` | Template file listing all env vars (committed to git, no secrets) |
| 8 | Add `src/app/utils/slug.utils.ts` | Slug generation utility for ride/driver names |
| 9 | Add `src/app/utils/email.utils.ts` | Nodemailer + EJS email template sender |
| 10 | Add Cloudinary config | Multer + multer-storage-cloudinary setup for file uploads |

---

## Clarified Business Logic Decisions

From the interview, these decisions are locked in:

1. **Separate role-based accounts** — one user = one role (Rider OR Driver). No combined account with role switching.
2. **Subscription model** — `isSubscribed: boolean` + `subscriptionExpires: Date`. Both must be valid for a driver to access rider contact info.
3. **Anonymous until confirmed** — Rider and Driver see only ride details (pickup/dropoff). Real contact details (phone, full name) revealed only after **both parties confirm** the ride.
4. **Drivers must be subscribed** to access rider contact details — enforced via middleware.

---

## Key Conventions to Follow

- **No raw `try/catch` in controllers** — use `catchAsync`
- **No raw `res.json()`** — use `sendResponse`
- **No inline errors** — `throw new AppError(statusCode, message)`
- **No `process.env` outside `config/env.ts`** — use `env` from env.ts
- **`.js` extension in all imports** — required by `module: ESNext` + `moduleResolution: bundler`
- **Zod v4** installed — API differs from v3 (check docs if issues arise)
- **Service-Controller pattern** — services handle business logic, controllers handle HTTP only

---

## Env Vars Already Configured (in `.env`)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/rideio
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=15m
REFRESH_SECRET=your_refresh_secret_here
REFRESH_EXPIRY=7d
BCRYPT_SALT_ROUNDS=10
FRONTEND_URL=http://localhost:5173
```

**Not yet in `.env`** (add when needed):
```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
SSL_STORE_ID=
SSL_STORE_PASSWORD=
```

---

## Next Steps (Suggested)

1. **Continue with Auth Module** — Phase 2: `auth.interface.ts`, `auth.model.ts`, `auth.validation.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.route.ts`
2. **Wire app.ts first** — Add global middleware (cors, JSON, routes, error handler) so the server actually accepts HTTP requests before testing Auth
3. **Add .env.example** — Commit a template so collaborators know all required env vars

---

## How to Resume

```bash
# Pull latest changes
git pull

# Start dev server
npm run dev

# Typecheck
npx tsc --noEmit

# Build for production
npm run build
```

> **Note:** Update `JWT_SECRET` and `REFRESH_SECRET` in `.env` with real secrets before deploying.