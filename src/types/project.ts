import { z } from "zod";
import { Types } from "mongoose";
import { Author } from "./user";

export const ProjectStageEnum = z.enum([
  "idea",
  "planning",
  "building",
  "testing",
  "launched",
]);

export const SupportTypeEnum = z.enum([
  "code-review",
  "design-feedback",
  "beta-testing",
  "accountability",
  "collaboration",
]);

export const createProjectSchema = z.object({
  title:             z.string().min(3).max(100),
  description:       z.string().min(10).max(1000),
  stage:             ProjectStageEnum,
  supportNeeded:     z.array(SupportTypeEnum).min(1),
  techStack:         z.array(z.string().max(30)).max(10).default([]),
  repoUrl:           z.string().url().optional().or(z.literal("")),
  demoUrl:           z.string().url().optional().or(z.literal("")),
  targetLaunchDate:  z.string().datetime().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type ProjectStage       = z.infer<typeof ProjectStageEnum>;
export type SupportType        = z.infer<typeof SupportTypeEnum>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export type Project = {
  _id:               string | Types.ObjectId;
  authorId:          string;
  title:             string;
  description:       string;
  stage:             ProjectStage;
  supportNeeded:     SupportType[];
  techStack:         string[];
  repoUrl?:          string;
  demoUrl?:          string;
  targetLaunchDate?: string;
  isCompleted:       boolean;
  completedAt?:      string;
  viewCount:         number;
  createdAt:         string;
  updatedAt:         string;
  author?:           Author | null;
};