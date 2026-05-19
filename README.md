# Rideio — Backend

A RESTful API backend for the Rideio ride-sharing platform, built with Express 5, TypeScript, and MongoDB. Handles authentication, ride management, subscriptions, notifications, and admin operations with role-based access control.

---

## Features

### Authentication & Authorization
- **JWT-based Auth** — Access + refresh token pair with automatic token refresh
- **Email Verification** — Gmail SMTP delivery with JWT verification tokens
- **Google OAuth** — Social login for riders (drivers must use email/password)
- **Role-Based Access Control** — USER (RIDER/DRIVER), ADMIN, SUPER_ADMIN with middleware guards
- **Password Reset** — Secure token-based password reset flow

### Ride Management
- **CRUD Operations** — Create, read, update rides with status-based filtering
- **Fare Calculation** — Haversine distance formula with vehicle-type-aware rates
- **Status Flow** — PENDING → ACCEPTED → IN_PROGRESS → COMPLETED / CANCELLED
- **One-Ride-at-a-Time** — Drivers blocked from accepting new rides while on active ride
- **Soft Delete** — Admins can soft-delete rides with reason tracking

### Subscription & Payments
- **SSLCommerz Integration** — Payment gateway for driver subscriptions (৳700/month)
- **Payment Validation** — IPN (Instant Payment Notification) verification
- **Subscription Status** — Real-time subscription checking with expiry tracking

### Notifications
- **In-App Notifications** — Push notifications for ride events, subscription updates, admin actions
- **Read/Unread Tracking** — Per-notification read status with bulk mark-as-read
- **Notification Settings** — User-configurable notification preferences

### Admin Panel
- **User Management** — View, search, soft-delete users with role filtering
- **Ride Oversight** — Monitor all rides with status-based filtering
- **Subscription Management** — Review and approve payment records
- **Dashboard Analytics** — Platform stats, top drivers, revenue tracking

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js (ESM) |
| **Framework** | Express 5 |
| **Language** | TypeScript |
| **Database** | MongoDB (Mongoose ODM) |
| **Auth** | JWT (access + refresh tokens) |
| **Validation** | Zod v4 |
| **Email** | Nodemailer (Gmail SMTP) |
| **File Upload** | Multer + Cloudinary |
| **Payments** | SSLCommerz |
| **Security** | Helmet, CORS, bcryptjs |
| **Deployment** | Render |

---

## Architecture

### Module Pattern
Every feature follows a consistent structure:
```
src/app/modules/[feature]/
├── [feature].interface.ts   # TypeScript interfaces/types
├── [feature].model.ts       # Mongoose model + schema
├── [feature].validation.ts  # Zod validation schemas
├── [feature].service.ts     # Business logic (no HTTP concerns)
├── [feature].controller.ts  # HTTP handlers (wrap with catchAsync)
└── [feature].route.ts       # Express routes (wire middleware + controller)
```

### Request Flow
```
Client Request
  → Express Middleware (CORS, Helmet, Cookie Parser)
  → Proxy Route (/api/v1/...)
  → Route Handler
    → validateRequest (Zod schema)
    → checkAuth (JWT verification + role check)
    → Controller (catchAsync wrapper)
    → Service (business logic)
    → Mongoose Model (database)
  → sendResponse (standardized JSON)
  → globalErrorHandler (error formatting)
```

### Error Handling
All errors flow through `globalErrorHandler` which formats:
- **AppError** — Custom errors with status codes and messages
- **Zod Errors** — Validation failures with field-level details
- **Mongoose Errors** — CastError, ValidationError, DuplicateKey
- **JWT Errors** — Token expiration, invalid tokens

### Database Design
- **Users** — Embedded notifications, subscription status, auth providers
- **Rides** — Geospatial coordinates, fare calculation, status tracking
- **Payments** — SSLCommerz transaction records with status tracking
- **Reviews** — One-per-ride constraint with driver rating aggregation
- **Soft Delete** — All models support `isDeleted` flag with auto-filtering pre-hooks

---

## Project Structure

```
src/
├── app/
│   ├── config/
│   │   ├── env.ts              # Environment variable validation
│   │   ├── cloudinary.config.ts # Cloudinary setup
│   │   └── multer.config.ts    # File upload config
│   ├── modules/
│   │   ├── auth/               # Authentication (login, register, verify, reset)
│   │   ├── user/               # User CRUD + profile management
│   │   ├── ride/               # Ride lifecycle (create, accept, start, complete, cancel)
│   │   ├── subscription/       # Payment + subscription management
│   │   ├── review/             # Ride reviews + driver ratings
│   │   ├── notification/       # In-app notifications
│   │   ├── dashboard/          # Analytics + stats
│   │   └── admin/              # Admin operations
│   ├── middlewares/
│   │   ├── checkAuth.ts        # JWT verification + role guard
│   │   ├── checkSubscription.ts # Driver subscription verification
│   │   ├── validateRequest.ts  # Zod schema validation
│   │   ├── globalErrorHandler.ts # Centralized error handling
│   │   └── notFound.ts         # 404 handler
│   ├── helpers/
│   │   ├── handleCastError.ts  # Mongoose CastError formatter
│   │   ├── handleDuplicateError.ts # Duplicate key formatter
│   │   ├── handleValidationError.ts # Mongoose validation formatter
│   │   └── handleZodError.ts   # Zod error formatter
│   ├── utils/
│   │   ├── sendEmail.ts        # Gmail SMTP email sender
│   │   ├── sendResponse.ts     # Standardized response formatter
│   │   ├── catchAsync.ts       # Async error wrapper
│   │   ├── distance.ts         # Haversine formula + fare calculation
│   │   ├── QueryBuilder.ts     # Filter, sort, paginate, search
│   │   ├── setCookie.ts        # Auth cookie management
│   │   └── usertokens.ts       # JWT token generation + refresh
│   ├── interfaces/             # Shared TypeScript interfaces
│   ├── errorHelpers/           # Custom AppError class
│   └── routes/                 # Route aggregation
├── app.ts                      # Express app configuration
└── server.ts                   # Server startup + graceful shutdown
```

---

## Key Technical Decisions

### ESM Module System
The backend uses `"type": "module"` in package.json. All internal imports must use `.js` extensions:
```typescript
import { envVars } from './config/env.js';  // ✅
import { envVars } from './config/env';     // ❌
```

### Fare Calculation
Fares are computed server-side using the Haversine formula with fixed rates:
```typescript
// Bike: ৳50 base + ৳15/km
// Car: ৳100 base + ৳50/km
const fare = baseFare + (distanceInKm * perKmRate)
```

### Database Indexes
Strategic indexes for common query patterns:
- `{ status: 1 }` — Ride status filtering
- `{ riderId: 1, status: 1 }` — Rider dashboard queries
- `{ driverId: 1, status: 1 }` — Driver dashboard queries
- `{ userId: 1, status: 1 }` — Payment history
- `{ rideId: 1 }` unique (partial) — Prevent duplicate reviews

### Cache Invalidation
Dashboard data is cached in-memory with 30-second TTL. Cache is invalidated on:
- Ride creation, acceptance, start, completion, cancellation
- Subscription changes

### Soft Delete
All major models (User, Ride, Payment) support soft delete via `isDeleted` flag. Mongoose pre-hooks automatically filter deleted documents from all queries.

---

## API Endpoints

### Auth (`/api/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Email/password login |
| POST | `/register/rider` | Rider registration |
| POST | `/register/driver` | Driver registration |
| POST | `/google-auth` | Google OAuth login |
| POST | `/verify-email` | Email verification |
| POST | `/resend-confirmation` | Resend verification email |
| POST | `/forgot-password` | Password reset request |
| POST | `/reset-password` | Password reset execution |
| POST | `/change-password` | Change password (authenticated) |
| POST | `/set-password` | Set password for OAuth users |
| POST | `/refresh-token` | Refresh access token |

### Rides (`/api/v1/rides`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all pending rides (filtered by vehicle type) |
| GET | `/my-rides` | Get current user's rides |
| GET | `/:id` | Get ride details |
| POST | `/` | Create a new ride |
| PATCH | `/:id/accept` | Accept a ride (driver) |
| PATCH | `/:id/start` | Start a ride (driver) |
| PATCH | `/:id/complete` | Complete a ride (driver) |
| PATCH | `/:id/cancel` | Cancel a ride (rider) |

### Users (`/api/v1/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get current user profile |
| PATCH | `/me` | Update profile |
| POST | `/me/photo` | Upload profile photo |

### Subscriptions (`/api/v1/subscriptions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/init` | Initiate payment |
| GET | `/status` | Get subscription status |
| GET | `/history` | Get payment history |
| POST | `/success` | Payment success callback |
| POST | `/fail` | Payment failure callback |
| POST | `/cancel` | Payment cancellation callback |
| POST | `/ipn` | Instant Payment Notification |

### Admin (`/api/v1/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| GET | `/rides` | List all rides |
| GET | `/subscriptions` | List all payments |
| PATCH | `/users/:id/soft-delete` | Soft delete user |
| PATCH | `/rides/:id/soft-delete` | Soft delete ride |
| PUT | `/subscriptions/:id/status` | Update payment status |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)
- Gmail account with App Password (for emails)
- SSLCommerz account (for payments)

### Installation
```bash
npm install
```

### Environment Variables
Create `.env` (see `.env.example` for full list):
```env
PORT=5000
NODE_ENV=development
DB_URL=mongodb://localhost:27017/rideio
JWT_ACCESS_SECRET=your_secret
JWT_REFRESH_SECRET=your_secret
JWT_VERIFICATION_SECRET=your_secret
FRONTEND_URL=http://localhost:3000
GMAIL_USER=your.email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Start (Production)
```bash
npm run start
```

---

## Deployment

### Render
1. Connect your GitHub repository
2. Render auto-detects `render.yaml` configuration
3. Set environment variables in Render dashboard:
   - `DB_URL` — MongoDB Atlas connection string
   - `FRONTEND_URL` — Your Vercel frontend URL
   - `GMAIL_USER` / `GMAIL_APP_PASSWORD` — Gmail SMTP credentials
   - `JWT_*` secrets — Auto-generated by Render
   - `CLOUDINARY_*` — Cloudinary credentials
   - `SSL_*` — SSLCommerz credentials
4. Deploy — Health check endpoint at `/health`

---

## License

MIT
