import { z } from "zod";

// ─── Project ────────────────────────────────────────────────────────────────

export const ProjectStage = z.enum([
  "idea",
  "planning",
  "building",
  "testing",
  "launched",
]);

export const SupportType = z.enum([
  "code-review",
  "design-feedback",
  "beta-testing",
  "accountability",
  "collaboration",
]);

export const createProjectSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  stage: ProjectStage,
  supportNeeded: z.array(SupportType).min(1),
  techStack: z.array(z.string().max(30)).max(10),
  repoUrl: z.string().url().optional().or(z.literal("")),
  demoUrl: z.string().url().optional().or(z.literal("")),
  targetLaunchDate: z.string().datetime().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// ─── Milestone ──────────────────────────────────────────────────────────────

export const createMilestoneSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
});

// ─── Comment ─────────────────────────────────────────────────────────────────

export const createCommentSchema = z.object({
  projectId: z.string().min(1),
  content: z.string().min(1).max(500),
});

// ─── User profile ────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  bio: z.string().max(300).optional(),
  techStack: z.array(z.string().max(30)).max(15).optional(),
  githubUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  availableForCollab: z.boolean().optional(),
});

// ─── Inferred types ──────────────────────────────────────────────────────────

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
