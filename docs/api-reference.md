# API Reference

All endpoints return JSON in the following envelope:

```ts
{
  success: boolean;
  data?:   T;        // present on success
  message?: string;  // present on failure
}
```

HTTP status codes follow standard conventions. Auth errors return `401`; ownership violations return `403`; validation failures return `400`.

---

## Authentication

All endpoints except `GET /api/projects` and `GET /api/projects/[id]` require an authenticated Clerk session. Requests without a valid session token receive `401 Unauthorised`.

---

## Projects

### `GET /api/projects`

Returns a paginated list of projects. Optionally filtered. No authentication required for browsing; authentication required for `mine=true`.

**Query Parameters**

| Parameter   | Type    | Default | Description                                      |
|-------------|---------|---------|--------------------------------------------------|
| `page`      | number  | `1`     | Page number (1-indexed)                          |
| `limit`     | number  | `10`    | Results per page (max 20)                        |
| `stage`     | string  | —       | Filter by stage: `idea`, `planning`, `building`, `testing`, `launched` |
| `completed` | boolean | —       | Filter by completion status (`true` / `false`)   |
| `mine`      | boolean | `false` | Return only the authenticated user's projects    |

**Response**

```json
{
  "success": true,
  "data": {
    "projects": [ /* Project[] with author populated */ ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  }
}
```

---

### `POST /api/projects`

Creates a new project. **Auth required.**

**Request Body**

```json
{
  "title":            "string (3–100 chars)",
  "description":      "string (10–1000 chars)",
  "stage":            "idea | planning | building | testing | launched",
  "supportNeeded":    ["code-review | design-feedback | beta-testing | accountability | collaboration"],
  "techStack":        ["string (max 10 items, each max 30 chars)"],
  "repoUrl":          "string (URL, optional)",
  "demoUrl":          "string (URL, optional)",
  "targetLaunchDate": "ISO 8601 datetime string (optional)"
}
```

**Response** — `201 Created` with the created project (author populated).

**Side Effects** — Broadcasts a `new_project` SSE event to all connected clients.

---

### `GET /api/projects/[id]`

Returns a single project by MongoDB `_id`. Increments the project's `viewCount` on every call.

**Response** — Project with author populated.

---

### `PATCH /api/projects/[id]`

Updates a project. **Auth required. Owner only.**

**Request Body** — Any subset of the `POST` body fields (all fields are optional).

**Response** — Updated project.

**Side Effects** — Broadcasts a `project_updated` SSE event.

---

### `DELETE /api/projects/[id]`

Marks a project as completed (sets `isCompleted: true`, `completedAt: now`, `stage: "launched"`). **Auth required. Owner only.**

> Note: This does not delete the project record. The name follows REST convention for a "complete" action on a resource.

**Response** — Updated project.

**Side Effects** — Broadcasts a `project_completed` SSE event.

---

## Milestones

### `GET /api/milestones?projectId=<id>`

Returns all milestones for a project, sorted newest first.

**Query Parameters**

| Parameter   | Type   | Required | Description         |
|-------------|--------|----------|---------------------|
| `projectId` | string | Yes      | MongoDB project `_id` |

---

### `POST /api/milestones`

Adds a milestone to a project. **Auth required. Owner only.**

**Request Body**

```json
{
  "projectId":   "string (MongoDB ObjectId)",
  "title":       "string (3–100 chars)",
  "description": "string (max 500 chars, optional)"
}
```

**Response** — `201 Created` with the created milestone.

**Side Effects** — Broadcasts a `new_milestone` SSE event containing `{ milestone, projectTitle }`.

---

## Comments

### `GET /api/comments?projectId=<id>`

Returns all comments for a project, sorted oldest first. Author details are populated on each comment.

**Query Parameters**

| Parameter   | Type   | Required | Description         |
|-------------|--------|----------|---------------------|
| `projectId` | string | Yes      | MongoDB project `_id` |

---

### `POST /api/comments`

Posts a comment on a project. **Auth required.**

**Request Body**

```json
{
  "projectId": "string (MongoDB ObjectId)",
  "content":   "string (1–500 chars)"
}
```

**Response** — `201 Created` with the created comment (author populated).

**Side Effects**
- Broadcasts a `new_comment` SSE event to all connected clients.
- If the commenter is not the project owner, sends a targeted `notification` SSE event to the project owner.

---

## User

### `GET /api/user`

Returns the authenticated user's full profile from MongoDB. **Auth required.**

Used by `SessionContext` on mount to populate user state client-side.

---

### `POST /api/user`

Creates the user's MongoDB record at the end of onboarding. **Auth required.**

The email address is fetched from Clerk — it cannot be supplied in the request body. After creation, sets `publicMetadata.onboarded = true` on the Clerk user so middleware redirects resolve correctly.

**Request Body**

```json
{
  "firstName":          "string (1–50 chars)",
  "lastName":           "string (1–50 chars)",
  "username":           "string (2–30 chars, lowercase/numbers/-/_)",
  "bio":                "string (max 300 chars, optional)",
  "githubUrl":          "string (URL, optional)",
  "portfolioUrl":       "string (URL, optional)",
  "techStack":          ["string (max 15 items, each max 30 chars)"],
  "availableForCollab": "boolean (default: true)"
}
```

**Response** — `201 Created` with the user record. Returns `200` if the user already exists (idempotent).

---

### `PATCH /api/user`

Updates the authenticated user's profile. **Auth required.**

**Request Body** — Any subset of profile fields.

**Response** — Updated user.

---

## Auth Webhook

### `POST /api/auth/webhook`

Clerk webhook endpoint for syncing identity events to MongoDB. Not called by the client directly. Secured via `CLERK_WEBHOOK_SECRET`.

---

## Feed (SSE)

### `GET /api/feed`

Opens a Server-Sent Events connection. **Auth required.** See [Real-Time (SSE)](./real-time-sse.md) for full details.

```
Content-Type: text/event-stream
```
