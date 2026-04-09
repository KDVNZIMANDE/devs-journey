// Schemas and input types all live in src/types/* 
// This file re-exports them for backwards compatibility with API route imports

export {
  createProjectSchema,
  updateProjectSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  createCommentSchema,
  updateCommentSchema,
  createUserSchema,
  updateUserSchema,
} from "@/types";

export type {
  CreateProjectInput,
  UpdateProjectInput,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  CreateCommentInput,
  UpdateCommentInput,
  CreateUserInput,
  UpdateUserInput,
} from "@/types";