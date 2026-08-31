# Viero Workspace

A simple multi-tenant starter built with Next.js and MongoDB. The visual direction is inspired by the clean, premium feel of Compass by VieroMind, while the codebase is intentionally small and easy to understand.

## Features

- Next.js App Router
- MongoDB + Mongoose
- Registration creates a new tenant/workspace and owner account
- Login/logout with HTTP-only JWT cookies
- Password hashing with bcrypt
- Tenant-isolated dashboard queries
- Owner/admin task assignment with priorities and due dates
- Member status and progress updates
- Team-wide task board and completion tracking
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
  mongodb.js
models/
  Tenant.js
  User.js
```

## Run locally

1. Install packages:
   `npm install`
2. Copy `.env.example` to `.env.local`.
3. Add your MongoDB Atlas connection string and JWT secret.
4. Run:
   `npm run dev`
5. Open `http://localhost:3000`.

## MongoDB Atlas

Create a free Atlas cluster, create a database user, allow your IP for local development, then copy the connection string into `MONGODB_URI`.

Example:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/viero_tenant_app?retryWrites=true&w=majority
JWT_SECRET=your-very-long-random-secret
```

Do not commit `.env.local`.

## Deploy to Vercel

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. In Vercel > Project Settings > Environment Variables, add:
   - `MONGODB_URI`
   - `JWT_SECRET`
4. Deploy.

For MongoDB Atlas, make sure the cluster network access allows connections from your deployed environment. A common simple setup for a student/demo project is allowing `0.0.0.0/0` and relying on a strong database username/password; for production, use tighter controls when your hosting architecture permits it.

## Multi-tenant design

Every user stores a `tenantId`. Data belonging to a workspace must also store the same `tenantId`. Every server-side query for tenant-owned data should include that tenant ID, for example:

```js
User.find({ tenantId: auth.tenantId })
```

Never accept a tenant ID from the browser as authorization. Read it from the verified session/JWT instead.
