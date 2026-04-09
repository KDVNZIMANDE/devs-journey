import { z } from "zod";
import { Types } from "mongoose";
import { Author } from "./user";

export const createCommentSchema = z.object({
  projectId: z.string().min(1),
  content:   z.string().min(1).max(500),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(500),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

export type Comment = {
  _id:       string | Types.ObjectId;
  projectId: string | Types.ObjectId;
  authorId:  string;
  content:   string;
  createdAt: string;
  author?:   Author | null;
};