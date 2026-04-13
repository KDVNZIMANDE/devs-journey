# Real-Time (Server-Sent Events)

DevBuild uses SSE for all real-time updates. Events flow server → client only; no WebSocket is required because all real-time data in this application originates server-side.

---

## Architecture

```
Client (useSSE hook)
  │
  │  GET /api/feed  (persistent HTTP connection)
  ▼
Edge Runtime (src/app/api/feed/route.ts)
  │
  │  ReadableStream
  ▼
SSE Connection Store (src/lib/sse/connections.ts)
  ▲
  │  broadcast() / sendToUser()
  │
API Route Handlers (POST /api/projects, /api/milestones, /api/comments)
```

The connection store is a singleton `Map<userId, ReadableStreamDefaultController>` attached to `globalThis` to survive Next.js hot-reloads.

---

## Connecting

Clients connect by calling `GET /api/feed`. An authenticated session is required; unauthenticated requests receive `401`.

On connection, the server immediately sends a heartbeat comment to confirm the stream is live:

```
: heartbeat
```

A keep-alive ping is sent every 60 seconds to prevent proxy timeouts:

```
: ping
```

The browser's `EventSource` API automatically reconnects if the connection is lost.

---

## Event Types

All events follow the SSE format:

```
event: <event_type>
data: <JSON string>
```

### `new_project`

Fired when a user creates a project.

```ts
// data shape
Project & { author: Author | null }
```

### `project_updated`

Fired when a project owner updates their project via `PATCH /api/projects/[id]`.

```ts
// data shape
Project (Mongoose document as plain object)
```

### `project_completed`

Fired when a project owner marks their project as complete via `DELETE /api/projects/[id]`.

```ts
// data shape
Project (isCompleted: true, stage: "launched")
```

### `new_milestone`

Fired when a project owner adds a milestone.

```ts
// data shape
{
  milestone:    Milestone;
  projectTitle: string;
}
```

### `new_comment`

Broadcast to **all** connected clients when any user posts a comment.

```ts
// data shape
Comment & { author: Author | null }
```

### `notification`

Sent **only to the project owner** when another user comments on their project. Uses `sendToUser()` instead of `broadcast()`.

```ts
// data shape
{
  type:      "new_comment";
  message:   string;  // e.g. "Alice commented on your project "DevBuild""
  projectId: string;
}
```

---

## Client Usage

The `useSSE` hook (`src/hooks/useSSE.ts`) wraps `EventSource` for use in React components:

```ts
useSSE({
  onNewProject:       (project) => { /* update feed */ },
  onProjectUpdated:   (project) => { /* patch local state */ },
  onProjectCompleted: (project) => { /* move to celebration wall */ },
  onNewMilestone:     ({ milestone, projectTitle }) => { /* show toast */ },
  onNewComment:       (comment)  => { /* append to comment list */ },
  onNotification:     (notif)    => { /* show notification badge */ },
});
```

The hook connects to `/api/feed` on mount and cleans up (closes the `EventSource`) on unmount.

---

## Connection Management

`src/lib/sse/connections.ts` exposes:

| Function | Signature | Description |
|----------|-----------|-------------|
| `addConnection` | `(userId, controller) => void` | Registers a client connection |
| `removeConnection` | `(userId) => void` | Removes a client on disconnect |
| `broadcast` | `(event, data) => void` | Sends an event to all connected clients |
| `sendToUser` | `(userId, event, data) => void` | Sends an event to a single user |

Each user maps to a single controller (one active tab). If a user opens a second tab, the second connection overwrites the first in the store.

---

## Tradeoffs

- SSE is **unidirectional** — all real-time data flows from server to client. Client actions (creating projects, posting comments) use normal REST endpoints.
- If bidirectional real-time communication is needed in the future (e.g. collaborative editing), this would require migrating to WebSockets or a service like Ably/Pusher.
- Each user can maintain **one active SSE connection**. Multi-tab support would require changing the store from `Map<userId, controller>` to `Map<userId, controller[]>`.
