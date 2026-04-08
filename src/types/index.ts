import { Types } from "mongoose";

// ─── Enums ───────────────────────────────────────────────────────────────────

export type ProjectStage = "idea" | "planning" | "building" | "testing" | "launched";

export type SupportType =
  | "code-review"
  | "design-feedback"
  | "beta-testing"
  | "accountability"
  | "collaboration";

// ─── Domain objects ──────────────────────────────────────────────────────────

export interface Author {
  clerkId: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  username: string;
}

export interface Project {
  _id: string | Types.ObjectId;
  authorId: string;
  title: string;
  description: string;
  stage: ProjectStage;
  supportNeeded: SupportType[];
  techStack: string[];
  repoUrl?: string;
  demoUrl?: string;
  targetLaunchDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author?: Author | null;
}

export interface Milestone {
  _id: string | Types.ObjectId;
  projectId: string | Types.ObjectId;
  authorId: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface Comment {
  _id: string | Types.ObjectId;
  projectId: string | Types.ObjectId;
  authorId: string;
  content: string;
  createdAt: string;
  author?: Author | null;
}

export interface UserProfile {
  _id: string | Types.ObjectId;
  clerkId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  bio?: string;
  techStack: string[];
  githubUrl?: string;
  portfolioUrl?: string;
  availableForCollab: boolean;
  createdAt: string;
}

// ─── SSE event payloads ──────────────────────────────────────────────────────

export type SSEEventType =
  | "new_project"
  | "project_updated"
  | "project_completed"
  | "new_milestone"
  | "new_comment"
  | "notification";

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
}

// ─── API responses ───────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  issues?: Record<string, string[]>;
}
