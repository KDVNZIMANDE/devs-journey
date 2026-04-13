# DevBuild — Documentation

**DevBuild** is a platform for developers to build in public, track progress, collaborate, and celebrate shipped projects.

---

## Table of Contents

- [Architecture Overview](./architecture.md)
- [API Reference](./api-reference.md)
- [Data Models](./data-models.md)
- [Real-Time (SSE)](./real-time-sse.md)
- [Authentication & Middleware](./auth-middleware.md)
- [ADR-001: Tech Stack](./adr/001-tech-stack.md)

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- Clerk account

### Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# MongoDB
MONGODB_URI=mongodb+srv://...
```

### Install & Run

```bash
npm install
npm run dev
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Sign-in and sign-up pages (Clerk-hosted UI)
│   ├── (root)/           # Authenticated app pages
│   │   ├── dashboard/
│   │   ├── feed/
│   │   ├── projects/
│   │   ├── celebration-wall/
│   │   └── Onboarding/
│   ├── api/              # Route Handlers (REST + SSE)
│   │   ├── auth/webhook/
│   │   ├── comments/
│   │   ├── feed/         # SSE endpoint
│   │   ├── milestones/
│   │   ├── projects/
│   │   └── user/
│   └── page.tsx          # Landing page
├── components/
│   ├── feed/
│   └── shared/
├── context/
│   └── SessionContext.tsx
├── hooks/
│   └── useSSE.ts
├── lib/
│   ├── db/mongoose.ts
│   ├── response/response.ts
│   ├── sse/connections.ts
│   └── validations/
├── models/               # Mongoose schemas
├── types/                # Zod schemas + TypeScript types
└── middleware.ts
```
