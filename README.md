# Juragan Kontrakan API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Backend API for **Juragan Kontrakan** (Rental Management System), built with **Nitro v3**, **TypeScript**, and **MongoDB**.

## Tech Stack
- **Framework**: [Nitro v3](https://nitro.build)
- **Runtime**: Node.js
- **Language**: TypeScript (Strict Mode)
- **Database**: MongoDB (via native driver)
- **Validation**: Zod
- **Authentication**: JWT & bcryptjs

---

## Architecture & Modules

The project follows a clean architecture pattern separating Routes (API endpoints), Services (Business Logic), Repositories (Data Access), and Schemas (Validation).

1. **Phase 1: Foundation**
   - Singleton MongoDB connection with standalone `retryWrites=false` support.
   - Centralized error handling & response formatter (`utils/response.ts`, `utils/errors.ts`).
   - Health check endpoint (`GET /api/health`).

2. **Phase 2: Authentication & Authorization**
   - User registration & login with secure password hashing (`bcryptjs`).
   - JWT-based authentication middleware (`requireAuth`, `requireRole`).
   - Auth endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/refresh`, `/api/auth/logout`).

3. **Phase 3: Property & Room Management**
   - Property CRUD with ownership scoping (`/api/properties`).
   - Room management per property with unique code constraints (`propertyId + code`) and derived occupancy status (`/api/properties/:propertyId/rooms`, `/api/rooms/:id`).

4. **Phase 4: Tenant Management & Rental Contracts**
   - Tenant CRUD with search & filter (`/api/tenants`).
   - Contract management linking Property, Room, and Tenant (`/api/contracts`).
   - Overlapping active contract prevention (returns `409 CONFLICT`).
   - Automatic room occupancy updates via MongoDB transactions.

5. **Phase 5: Rental Price History**
   - Room rent price history supporting historical and future pricing (`/api/rooms/:roomId/rent-prices`).
   - Strict overlapping effective date prevention (`409 CONFLICT`).
   - `getRoomPriceAtDate(roomId, date)` lookup utility.

6. **Phase 6: Financial Billing Engine**
   - Automated monthly invoice generation (`POST /api/invoices/generate`) with idempotent duplicate protection (`contractId + billingPeriod` unique index).
   - Price snapshotting (contracts keep agreed rent; future price changes don't alter existing invoices).
   - Dynamic due date handling (including end-of-month adjustments for February/short months).
   - Invoice management and soft cancellation (`/api/invoices`).

7. **Phase 7: Payment Recording**
   - Atomic payment recording via MongoDB transactions (`/api/invoices/:invoiceId/payments`).
   - Overpayment protection (`409 CONFLICT`).
   - Dynamic invoice status calculation (`unpaid`, `partial`, `paid`, `overdue`).

8. **Phase 8: Mobile Dashboard & Financial Reports**
   - Mobile dashboard summary endpoint (`GET /api/dashboard`).
   - Revenue and actual earnings reports (`GET /api/reports/revenue`).
   - Monthly occupancy rate tracking (`GET /api/reports/occupancy`).

---

## Getting Started

### 1. Installation
```bash
yarn install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=rental_management
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
```

### 3. Development
```bash
yarn run dev
```

### 4. Build for Production
```bash
yarn run build
node .output/server/index.mjs
```
