# Authentication & Middleware

DevBuild uses [Clerk](https://clerk.dev) for authentication. Clerk manages sessions, device tracking, and brute-force protection. MongoDB stores application-level user data (profile, tech stack, etc.).

---

## Authentication Flow

```
1. User visits any protected page (unauthenticated)
        │
        ▼
2. Middleware detects no session → redirect to /sign-in
        │
        ▼
3. Clerk handles sign-in / sign-up
        │
        ▼
4. Clerk fires `user.created` webhook → POST /api/auth/webhook
   (basic Clerk record created; user not yet in MongoDB)
        │
        ▼
5. Middleware detects session but publicMetadata.onboarded !== true
   → redirect to /Onboarding
        │
        ▼
6. User completes onboarding form → POST /api/user
   MongoDB record created; Clerk publicMetadata.onboarded = true
        │
        ▼
7. Middleware now allows full access → redirect to /feed
```

---

## Middleware (`src/middleware.ts`)

The middleware runs on every request (excluding static assets) and enforces three rules:

### Rule 1 — Unauthenticated access

If no Clerk session exists and the route is not public, redirect to `/sign-in` with `redirect_url` set so the user lands back where they started after signing in.

**Public routes:** `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/auth/webhook`

### Rule 2 — API passthrough

Authenticated requests to `/api/(.*)` always pass through. API route handlers perform their own auth and authorisation checks independently.

### Rule 3 — Onboarding gate

After authentication, the middleware checks `sessionClaims.metadata.onboarded`:

| Condition | Action |
|-----------|--------|
| Not onboarded, not on `/Onboarding` | Redirect to `/Onboarding` |
| Already onboarded, visiting `/Onboarding` | Redirect to `/feed` |
| Otherwise | Pass through |

---

## Clerk Webhook (`POST /api/auth/webhook`)

Receives lifecycle events from Clerk (e.g. `user.created`, `user.updated`, `user.deleted`). Secured via `CLERK_WEBHOOK_SECRET`.

This webhook performs lightweight sync — it does not create the full MongoDB user record. That happens at the end of onboarding via `POST /api/user`.

---

## API-Level Authorisation

Route handlers use `auth()` from `@clerk/nextjs/server` to get the current `userId`. Ownership is enforced by comparing `userId` against the resource's `authorId` field:

```ts
const { userId } = await auth();
if (!userId) return fail("Unauthorised", ..., 401);

const project = await Project.findById(id);
if (project.authorId !== userId) return fail("Forbidden", ..., 403);
```

This pattern is used in:
- `PATCH /api/projects/[id]` — only the project author can update
- `DELETE /api/projects/[id]` — only the project author can complete
- `POST /api/milestones` — only the project author can add milestones

Comments (`POST /api/comments`) are open to any authenticated user.

---

## SessionContext (`src/context/SessionContext.tsx`)

A React context that wraps the app and makes the current user's MongoDB data available throughout the UI. On mount, it calls `GET /api/user` to load the full user profile.

This is separate from Clerk's own `useUser()` hook, which returns Clerk-level identity data. `SessionContext` provides the application-level profile (bio, tech stack, GitHub URL, etc.).
