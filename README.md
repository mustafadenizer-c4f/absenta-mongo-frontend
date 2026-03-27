# Absenta — Frontend

React frontend for the Absenta leave management system.

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
| Admin | + User Management, Leave Types, Holidays, Collective Leave, Settings, Team Calendar, App Manual |
| Supervisor | Companies, Label Management, System Manual |

## Project Structure

```
src/
├── components/
│   ├── admin/           # Admin pages (dashboard, users, settings, etc.)
│   ├── auth/            # Login, forgot password, password reset
│   ├── common/          # Layout, ProtectedRoute, ErrorBoundary
│   ├── general-manager/ # Department manager views
│   ├── group-manager/   # Group manager views
│   ├── manager/         # Team manager views
│   ├── profile/         # User profile page
│   ├── staff/           # Staff pages (dashboard, request, history, calendar)
│   └── supervisor/      # Supervisor pages (companies, labels, system guide)
├── contexts/            # LanguageContext (i18n)
├── config/              # API client configuration
├── services/            # API service classes
├── store/               # Redux store and slices
├── types/               # TypeScript interfaces
├── App.tsx              # Routes and app shell
└── theme.ts             # MUI theme
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server on port 3000 |
| `npm run build` | Production build to `build/` |
| `npm test` | Run tests |
