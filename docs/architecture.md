# Architecture Overview

DevBuild is a full-stack Next.js 14 application using the App Router. There is no separate backend service — all API logic lives in Next.js Route Handlers, colocated with the frontend in a single repository.

---

## Stack

| Concern        | Choice                          | Why                                                                              |
|----------------|---------------------------------|----------------------------------------------------------------------------------|
| Framework      | Next.js 14 (App Router)         | Full-stack in one repo; Route Handlers replace a separate API service            |
| Language       | TypeScript                      | Shared types across frontend and backend; compile-time safety                   |
| Styling        | Tailwind CSS + shadcn/ui        | Utility-first with accessible component primitives                               |
| Auth           | Clerk                           | Production-grade session management; avoids custom JWT implementation            |
| Real-time      | Server-Sent Events (Edge)       | All real-time events are server→client only; SSE is sufficient and dependency-free |
| Validation     | Zod                             | Single schema definition shared between API validation and client forms          |
| Database       | MongoDB Atlas + Mongoose        | Document model fits flexible project/milestone/comment structure                 |

---

## Request Flow

### Page Request

```
Browser → Next.js Middleware (auth check, onboarding gate)
        → App Router (RSC)
        → MongoDB (via Mongoose)
        → Rendered HTML
```

### API Request

```
Browser → Next.js Route Handler
        → auth() (Clerk)
        → Zod validation
        → MongoDB (via Mongoose)
        → JSON response
        → broadcast() or sendToUser() (SSE side-effect if applicable)
```

### Real-Time Feed

```
Browser (EventSource) ──── GET /api/feed ────▶ Edge Runtime
                                               (persistent ReadableStream)
                                                    │
API Route Handler ──── broadcast(event, data) ──────┘
```

---

## Key Patterns

### Response helpers (`src/lib/response/response.ts`)

All Route Handlers use `ok()` and `fail()` for consistent response shapes and server-side logging:

```ts
return ok("POST /api/projects", payload, userId, 201);
return fail("Unauthorised", "POST /api/projects", undefined, 401);
```

### Database connection (`src/lib/db/mongoose.ts`)

Connections are cached on `globalThis` to survive Next.js hot-reloads in development and prevent connection exhaustion in serverless environments.

### Model safety guard

Mongoose models are registered with a hot-reload guard:

```ts
export const User = models.User || model<IUser>("User", UserSchema);
```

This prevents `OverwriteModelError` when Next.js re-evaluates modules during development.

### Type sharing

Zod schemas defined in `src/types/` serve dual purpose:
1. Runtime validation in Route Handlers (`.safeParse()`)
2. TypeScript type inference (`z.infer<typeof schema>`)

Client components import the same types, keeping frontend and backend in sync with no duplication.

---

## Clerk ↔ MongoDB Sync

Clerk is the authoritative source for identity (email, session, device management). MongoDB holds application data (bio, tech stack, project history).

The sync has two steps:

1. **Webhook** (`POST /api/auth/webhook`) — handles Clerk lifecycle events (user created/updated/deleted).
2. **Onboarding** (`POST /api/user`) — creates the full MongoDB profile at the end of the onboarding flow and sets `publicMetadata.onboarded = true` on the Clerk user.

The `onboarded` flag in Clerk's `publicMetadata` is the source of truth for middleware routing. It is set via `clerkClient().users.updateUserMetadata()` inside the Route Handler, not via the webhook.

---

## Deployment Considerations

- The SSE connection store (`src/lib/sse/connections.ts`) uses an in-process `Map`. This works for single-instance deployments. For horizontally scaled deployments, the store would need to move to a shared pub/sub layer (e.g. Redis Pub/Sub).
- The `/api/feed` route runs on Edge Runtime for persistent streaming without serverless execution timeouts.
- All other routes use the default Node.js runtime.
