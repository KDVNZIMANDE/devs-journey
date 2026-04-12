# ADR-001: Technology stack selection

## Context

We are building DevBuild — a platform for developers to build in public, track progress, collaborate, and celebrate shipped projects. The platform requires real-time feed updates, secure authentication, and a clean developer experience that supports rapid iteration.

## Decision

We will use the following stack:

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Clerk |
| Real-time | Server-Sent Events via Edge Runtime |
| Validation | Zod |
| Database | MongoDB Atlas + Mongoose |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions → ? |

## Rationale

**Next.js as a full-stack framework** eliminates the need for a separate backend service. Route Handlers handle API logic, colocated with the frontend in a single repo. This simplifies CI/CD, documentation, and deployment.

**SSE over WebSockets or third-party services** because all real-time events in this application flow from server to client (new posts, comments, milestones). SSE is a native browser API requiring no external dependency, and Next.js Edge Runtime supports long-lived streaming responses without execution timeouts.

**Clerk over custom JWT auth** because auth is a critical security surface. Clerk provides production-grade session management, brute-force protection, and device tracking out of the box. Using a managed solution reduces the risk of implementation errors in a security-critical component.

**MongoDB Atlas** fits the document-oriented nature of the data (projects with nested milestones, varied tech stacks, flexible support types). Atlas provides free-tier cloud hosting with IP whitelisting and automated backups.

**TypeScript end-to-end** enables shared types between frontend and backend, catches bugs at compile time, and serves as a form of living documentation.

## Consequences

- Clerk manages identity; MongoDB manages app data. A webhook sync must be maintained to keep them consistent.
- SSE is one-directional. Any future need for bidirectional communication (e.g. real-time collaborative editing) would require revisiting this decision.
