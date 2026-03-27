# Absenta — Leave Management System

A full-stack leave management application supporting multi-company, multi-role organizational hierarchies with automated entitlement calculations based on Turkish labor law.

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![MongoDB](https://img.shields.io/badge/MongoDB-8-green) ![MUI](https://img.shields.io/badge/MUI-7-purple)

---

## Architecture

```
┌─────────────────────┐       ┌─────────────────────┐       ┌──────────────┐
│   React Frontend    │──────▶│  Express REST API    │──────▶│   MongoDB    │
│   (Port 3000)       │ HTTP  │  (Port 5000)         │       │  (Port 27017)│
│   MUI + Redux       │◀──────│  JWT Auth + Mongoose │◀──────│              │
└─────────────────────┘       └─────────────────────┘       └──────────────┘
```

**Frontend:** React 19, TypeScript, Material UI 7, Redux Toolkit, React Router 7, Recharts, React Big Calendar

**Backend:** Node.js, Express 4, TypeScript, Mongoose 8, JWT (access + refresh tokens), bcrypt

**Database:** MongoDB Community Server (local) or MongoDB Atlas (cloud)

---

## Prerequisites

- Node.js 18+
- MongoDB Community Server 8.x (installed and running as a service)
- MongoDB Compass (optional, for visual DB management)

---

## Quick Start

### 1. Clone and install

```bash
# Backend
cd server
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

**server/.env**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/absenta
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
```

**frontend/.env**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Seed the database

```bash
cd server
npm run seed
```

This creates:
- A default company (teams hierarchy, Mon–Fri workdays)
- A supervisor account: `supervisor@absenta.local` / `Pp123456`
- A company admin account: `admin@absenta.local` / `Pp123456`
- 8 default leave types (Annual, Sick, Casual, Maternity, Paternity, Marriage, Bereavement, Unpaid)

### 4. Run

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd frontend
npm start
```

Open http://localhost:3000 and log in. Both seed accounts require a password change on first login.

---

## Organizational Hierarchy

Absenta supports four hierarchy profiles, configurable per company:

| Profile | Structure | Roles Available |
|---------|-----------|-----------------|
| **Flat** | No teams or departments | Staff, Admin |
| **Teams** | Company → Teams | Staff, Manager, Admin |
| **Departments** | Company → Departments → Teams | Staff, Manager, Dept Manager, Admin |
| **Groups** | Company → Groups → Departments → Teams | Staff, Manager, Dept Manager, Group Manager, Admin |

The **Supervisor** role sits above all companies and manages multi-tenant operations.

---

## Roles & Permissions

| Role | Scope | Key Capabilities |
|------|-------|------------------|
| **Staff** | Self | Request leave, view balances, view personal calendar and history |
| **Manager** | Direct reports (team) | Approve/reject leave, view team calendar, view team balances |
| **Group Manager** | All teams in group | Same as Manager but across the entire group |
| **Dept Manager** | All teams in department | Same as Manager but across the entire department |
| **Admin** | Entire company | Manage users, leave types, holidays, collective leave, settings, reports, company calendar |
| **Supervisor** | All companies | Create/disable companies, reset admin passwords |

---

## Features

### Leave Management
- Request leave with start/end dates, leave type, and optional reason
- Half-day leave support (morning or afternoon)
- Automatic exclusion of weekends and public holidays from day count
- Remaining balance shown before submission
- Cancel pending requests

### Approval Workflow
- Managers approve/reject leave from direct reports
- Each request shows employee name, dates, leave type, and remaining balance
- Multi-level approval chain follows the hierarchy profile

### Balance Tracking
- Per-employee balance table by leave type
- Click on a balance cell to see individual request details
- Only actively used leave types shown as columns
- Annual leave entitlement auto-calculated from hire date (Turkish labor law)

### Calendar Views
- Personal calendar with approved/pending leave and holidays
- Team/department/group calendar with conflict highlighting (2+ members off = red)
- Month, week, day views plus 3-month overview

### Admin Features
- User management: create, edit, assign roles, reset passwords
- Leave type management: name, default days, color code, active/inactive
- Holiday management: single-day or multi-day, optionally recurring
- Collective leave: company-wide leave days that auto-deduct from annual balance
- Organization structure: manage teams, departments, groups based on hierarchy profile
- Company settings and hierarchy profile configuration

### Supervisor Features
- Create and manage multiple companies
- Auto-seeds default leave types and admin user per company
- Enable/disable companies
- Reset admin passwords

---

## Turkish Annual Leave Law (Article 53)

Annual leave entitlement is automatically calculated based on seniority:

| Service Duration | Entitlement |
|-----------------|-------------|
| 1–5 years | 14 days |
| 5–15 years | 20 days |
| 15+ years | 26 days |
| Under 18 or over 50 | Minimum 20 days |

Seniority is calculated from the hire date. Age-based adjustments use the birth date. Both fields must be set in the user profile for accurate calculation.

---

## Default Leave Types

| Type | Default Days | Color |
|------|-------------|-------|
| Annual Leave | 14 | 🟢 Green |
| Sick Leave | 10 | 🔴 Red |
| Casual Leave | 5 | 🟠 Orange |
| Maternity Leave | 112 | 🩷 Pink |
| Paternity Leave | 5 | 🔵 Blue |
| Marriage Leave | 3 | 🟣 Purple |
| Bereavement Leave | 3 | ⚫ Grey |
| Unpaid Leave | 0 | 🟤 Brown |

Admins can add, edit, or deactivate leave types per company.

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate refresh token |
| POST | `/api/auth/change-password` | Change password |
| GET | `/api/auth/session` | Get current user from token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (filtered by company) |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| POST | `/api/users/:id/reset-password` | Reset user password |

### Leave Types
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leave-types` | List leave types |
| POST | `/api/leave-types` | Create leave type |
| PUT | `/api/leave-types/:id` | Update leave type |
| DELETE | `/api/leave-types/:id` | Delete leave type |

### Leave Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leave-requests` | List leave requests |
| POST | `/api/leave-requests` | Create leave request |
| PUT | `/api/leave-requests/:id` | Update leave request |
| DELETE | `/api/leave-requests/:id` | Delete leave request |

### Holidays, Balances, Organization, Supervisor
Similar CRUD patterns — see `server/src/routes/` for full details.

---

## Project Structure

```
absenta_mongo/
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # UI components by role
│   │   │   ├── admin/         # Admin dashboard, users, settings, etc.
│   │   │   ├── auth/          # Login, signup, password reset
│   │   │   ├── common/        # Layout, ProtectedRoute, ErrorBoundary
│   │   │   ├── general-manager/
│   │   │   ├── group-manager/
│   │   │   ├── manager/
│   │   │   ├── profile/
│   │   │   ├── staff/
│   │   │   └── supervisor/
│   │   ├── config/            # API client
│   │   ├── services/          # API service classes
│   │   ├── store/             # Redux slices
│   │   └── types/             # TypeScript interfaces
│   └── public/
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/            # Database connection
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth, authorization, error handling
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # Express routes
│   │   ├── utils/             # Password, JWT, entitlement calc
│   │   ├── seed.ts            # Database seed script
│   │   └── index.ts           # Server entry point
│   └── .env
│
└── dbfiles/                   # (reserved for DB exports)
```

---

## Scripts

### Server
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload (nodemon) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production server |
| `npm run seed` | Seed database with defaults |
| `npm test` | Run tests |

### Frontend
| Command | Description |
|---------|-------------|
| `npm start` | Start dev server on port 3000 |
| `npm run build` | Production build to `build/` |
| `npm test` | Run tests |

---

## License

Private — internal use only.
