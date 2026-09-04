# Viero Workspace

A simple multi-tenant starter built with Next.js and Neon PostgreSQL. The visual direction is inspired by the clean, premium feel of Compass by VieroMind, while the codebase is intentionally small and easy to understand.

## Features

- Next.js App Router
- Neon serverless PostgreSQL
- Registration creates a new tenant/workspace and owner account
- Login/logout with HTTP-only JWT cookies
- Password hashing with bcrypt
- Tenant-isolated dashboard queries
- Owner/admin task assignment with priorities and due dates
- Member status and progress updates
- Team-wide task board and completion tracking
- Tenant-configurable incoming and outgoing webhooks
- Signed external API calls for task lifecycle events
- Encrypted integration secrets and webhook delivery history
- Responsive landing page and dashboard
- Vercel-ready structure

## Project structure

```text
app/
  api/auth/login/route.js
  api/auth/logout/route.js
  api/auth/register/route.js
  api/dashboard/route.js
  dashboard/page.js
  dashboard/tasks/page.js
  login/page.js
  register/page.js
  globals.css
  layout.js
  page.js
components/
  AuthForm.js
  LogoutButton.js
  Navbar.js
lib/
  auth.js
  data.js
  db.js
```

## Run locally

1. Install packages:
   `npm install`
2. Copy `.env.example` to `.env.local`.
3. Add your Neon `DATABASE_URL` and JWT secret.
4. Run:
   `npm run dev`
5. Open `http://localhost:3000`.

## Neon PostgreSQL

The easiest deployment setup is **Vercel Dashboard → Project → Storage → Create Database → Neon**. Connect the database to Production, Preview, and Development. Vercel injects `DATABASE_URL` automatically; no IP allowlist is needed.

The application creates its `tenants`, `users`, and `tasks` tables and indexes automatically on its first database request.

Example:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
JWT_SECRET=your-very-long-random-secret
```

Do not commit `.env.local`.

## API and webhooks

Owners and admins can configure integrations at `/dashboard/integrations`.

Outgoing webhooks are sent for `task.created`, `task.updated`, and `task.deleted`. Each JSON request includes these headers:

```text
X-Viero-Event
X-Viero-Delivery
X-Viero-Timestamp
X-Viero-Signature: sha256=<HMAC digest>
```

The signature is an HMAC-SHA256 digest of `<timestamp>.<raw JSON body>` using the workspace integration secret. Outgoing URLs must use HTTPS and cannot resolve to a private network address.

External systems can create a task with `POST /api/webhooks/incoming/<workspace-slug>` and the header `Authorization: Bearer <integration-secret>`:

```json
{
  "event": "task.create",
  "data": {
    "title": "Prepare monthly report",
    "assigneeEmail": "member@example.com",
    "priority": "high",
    "description": "Optional details",
    "dueDate": "2026-10-01"
  }
}
```

Integration secrets are encrypted in PostgreSQL using an AES-256-GCM key derived from `JWT_SECRET`. Changing `JWT_SECRET` invalidates existing integration secrets, so regenerate the workspace integration secret after rotating it.

## Deploy to Vercel

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Set the Vercel **Root Directory** to `viero-tenant-app` because the application is nested inside the repository folder.
4. In Vercel → Project → Storage, create and connect a Neon database. This injects `DATABASE_URL` into the selected environments.
5. In Vercel → Project Settings → Environment Variables, add `JWT_SECRET` to Production, Preview, and Development.
6. Redeploy, then visit `/api/health`. A working deployment returns `{"status":"healthy","database":"connected"}`.

`.env.local` is only for local development and is intentionally excluded from deployments. Never commit it.

## Multi-tenant design

Every user stores a `tenant_id`. Data belonging to a workspace also stores the same `tenant_id`. Every server-side query for tenant-owned data includes that tenant ID, for example:

```js
SELECT id, name, email FROM users WHERE tenant_id = $1
```

Never accept a tenant ID from the browser as authorization. Read it from the verified session/JWT instead.
