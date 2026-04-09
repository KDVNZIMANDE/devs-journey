import { z } from "zod";
import { Types } from "mongoose";

export const createMilestoneSchema = z.object({
  projectId:   z.string().min(1),
  title:       z.string().min(3).max(100),
  description: z.string().max(500).optional(),
});

export const updateMilestoneSchema = createMilestoneSchema.partial().omit({ projectId: true });

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;

export type Milestone = {
  _id:          string | Types.ObjectId;
  projectId:    string | Types.ObjectId;
  authorId:     string;
  title:        string;
  description?: string;
  createdAt:    string;
};