# Data Models

DevBuild uses MongoDB with Mongoose. All models are defined in `src/models/index.ts`. TypeScript types and Zod validation schemas live alongside them in `src/types/`.

---

## User

Stores developer profile data. Synced from Clerk via webhook on sign-up; enriched during onboarding.

### Schema

| Field                | Type       | Required | Constraints                        | Default |
|----------------------|------------|----------|------------------------------------|---------|
| `clerkId`            | `string`   | Yes      | Unique, indexed                    |         |
| `email`              | `string`   | No       | —                                  | `""`    |
| `username`           | `string`   | Yes      | Unique, indexed, 2–30 chars, `[a-z0-9_-]` | |
| `firstName`          | `string`   | Yes      | 1–50 chars                         |         |
| `lastName`           | `string`   | Yes      | 1–50 chars                         |         |
| `imageUrl`           | `string`   | No       | —                                  | `""`    |
| `bio`                | `string`   | No       | Max 300 chars                      |         |
| `techStack`          | `string[]` | No       | Max 15 items, each max 30 chars    | `[]`    |
| `githubUrl`          | `string`   | No       | URL                                | `""`    |
| `portfolioUrl`       | `string`   | No       | URL                                | `""`    |
| `availableForCollab` | `boolean`  | No       | —                                  | `true`  |
| `createdAt`          | `Date`     | —        | Auto (timestamps)                  |         |
| `updatedAt`          | `Date`     | —        | Auto (timestamps)                  |         |

### Author (embedded shape)

When user data is attached to projects or comments, only the following fields are included:

```ts
type Author = {
  clerkId:   string;
  firstName: string;
  lastName:  string;
  imageUrl:  string;
  username:  string;
}
```

---

## Project

The central entity. Tracks a developer's build-in-public work from idea to launch.

### Schema

| Field               | Type       | Required | Constraints                               | Default   |
|---------------------|------------|----------|-------------------------------------------|-----------|
| `authorId`          | `string`   | Yes      | Clerk user ID, indexed                    |           |
| `title`             | `string`   | Yes      | Max 100 chars                             |           |
| `description`       | `string`   | Yes      | Max 1000 chars                            |           |
| `stage`             | `string`   | Yes      | Enum: see below                           |           |
| `supportNeeded`     | `string[]` | No       | Enum values: see below                    | `[]`      |
| `techStack`         | `string[]` | No       | Max 10 items, each max 30 chars           | `[]`      |
| `repoUrl`           | `string`   | No       | URL                                       | `""`      |
| `demoUrl`           | `string`   | No       | URL                                       | `""`      |
| `targetLaunchDate`  | `Date`     | No       | —                                         |           |
| `isCompleted`       | `boolean`  | No       | Indexed                                   | `false`   |
| `completedAt`       | `Date`     | No       | Set when `isCompleted` → `true`           |           |
| `viewCount`         | `number`   | No       | Incremented on each `GET /api/projects/[id]` | `0`  |
| `createdAt`         | `Date`     | —        | Auto (timestamps)                         |           |
| `updatedAt`         | `Date`     | —        | Auto (timestamps)                         |           |

### Stage Enum

```
idea → planning → building → testing → launched
```

### Support Needed Enum

| Value              | Meaning                          |
|--------------------|----------------------------------|
| `code-review`      | Wants code reviewed              |
| `design-feedback`  | Wants UI/UX feedback             |
| `beta-testing`     | Wants testers                    |
| `accountability`   | Wants a check-in partner         |
| `collaboration`    | Open to a co-builder             |

---

## Milestone

A progress checkpoint attached to a project. Only the project author can create milestones.

### Schema

| Field         | Type          | Required | Constraints        |
|---------------|---------------|----------|--------------------|
| `projectId`   | `ObjectId`    | Yes      | Ref: `Project`, indexed |
| `authorId`    | `string`      | Yes      | Clerk user ID      |
| `title`       | `string`      | Yes      | 3–100 chars        |
| `description` | `string`      | No       | Max 500 chars      |
| `createdAt`   | `Date`        | —        | Auto (timestamps)  |

---

## Comment

A comment left on a project. Any authenticated user can comment.

### Schema

| Field       | Type       | Required | Constraints               |
|-------------|------------|----------|---------------------------|
| `projectId` | `ObjectId` | Yes      | Ref: `Project`, indexed   |
| `authorId`  | `string`   | Yes      | Clerk user ID             |
| `content`   | `string`   | Yes      | 1–500 chars               |
| `createdAt` | `Date`     | —        | Auto (timestamps)         |

---

## Validation

All mutation endpoints validate request bodies against Zod schemas defined in `src/types/`. The same schemas are used for both runtime validation in Route Handlers and client-side form validation, ensuring a single source of truth.

```
src/types/
├── api.ts        # ApiResponse, PaginatedResponse, ApiError
├── comment.ts    # createCommentSchema, updateCommentSchema, Comment type
├── index.ts      # Re-exports all types and schemas
├── milestone.ts  # createMilestoneSchema, updateMilestoneSchema, Milestone type
├── project.ts    # createProjectSchema, updateProjectSchema, Project type, enums
├── sse.ts        # SSEEvent, SSEEventType
└── user.ts       # userSchema, createUserSchema, updateUserSchema, User type, Author type
```
