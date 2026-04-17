# Frontend

React frontend for the Leave management system.

## Tech Stack

- React 19, TypeScript, Material UI 7, Redux Toolkit, React Router 7
- Recharts (dashboard charts), React Big Calendar (calendar views)

## Setup

```bash
npm install
```

**frontend/.env**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

```bash
npm start
```

Opens at http://localhost:3000.

## Roles & Views

| Role | Views |
|------|-------|
| Staff | Dashboard, Request Leave, Leave History, Calendar |
| Manager | + Approvals, Team View, Team Balances |
| Group Manager | + Group Approvals, Group Team View, Group Balances |
| Dept Manager | + Dept Approvals, Dept Calendar, Dept Balances |
| Admin | + User Management, Leave Types, Holidays, Important Days, Collective Leave, Settings (Organization, Workdays, Email, Database), Team Calendar, App Manual |
| Supervisor | Companies (with Reset to System Database), Default Leave Types, Label Management, System Manual |

## Project Structure

```
src/
├── components/
│   ├── admin/           # Admin pages (dashboard, users, holidays, important days, settings, etc.)
│   ├── auth/            # Login, forgot password, password reset
│   ├── common/          # Layout, ProtectedRoute, ErrorBoundary
│   ├── general-manager/ # Department manager views
│   ├── group-manager/   # Group manager views
│   ├── manager/         # Team manager views
│   ├── profile/         # User profile page
│   ├── staff/           # Staff pages (dashboard, request, history, calendar)
│   └── supervisor/      # Supervisor pages (companies, labels, system guide)
├── contexts/            # LanguageContext (i18n / bilingual EN+TR)
├── config/              # API client configuration
├── services/            # API service classes (holidays, importantDays, organization, supervisor, etc.)
├── store/               # Redux store and slices
├── types/               # TypeScript interfaces (Company, User, CustomMongoConfig, etc.)
├── utils/               # Helpers (resolveImportantDays, localize, calendarLocalizer)
├── App.tsx              # Routes and app shell
└── theme.ts             # MUI theme
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server on port 3000 |
| `npm run build` | Production build to `build/` |
| `npm test` | Run tests |

## Deployment (S3 + CloudFront)

1. Run `npm run build`
2. Upload the `build/` folder contents to your S3 bucket
3. In CloudFront → Error Pages, add custom error responses:
   - 403 → `/index.html` → 200
   - 404 → `/index.html` → 200
4. Invalidate the CloudFront cache: `/*`
