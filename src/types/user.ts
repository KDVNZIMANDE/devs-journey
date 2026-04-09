import { z } from "zod";
import { Types } from "mongoose";

export const userSchema = z.object({
  clerkId:            z.string(),
  email:              z.string().email(),
  username:           z.string().min(2).max(30).regex(/^[a-z0-9_-]+$/, "Lowercase letters, numbers, - and _ only"),
  firstName:          z.string().min(1).max(50),
  lastName:           z.string().min(1).max(50),
  imageUrl:           z.string().default(""),
  bio:                z.string().max(300).optional(),
  techStack:          z.array(z.string().max(30)).max(15).default([]),
  githubUrl:          z.string().url().optional().or(z.literal("")),
  portfolioUrl:       z.string().url().optional().or(z.literal("")),
  availableForCollab: z.boolean().default(true),
});

export const createUserSchema = userSchema.pick({
  firstName:          true,
  lastName:           true,
  username:           true,
  bio:                true,
  githubUrl:          true,
  portfolioUrl:       true,
  techStack:          true,
  availableForCollab: true,
});

export const updateUserSchema = createUserSchema.partial();

export type CreateUserInput  = z.infer<typeof createUserSchema>;
export type UpdateUserInput  = z.infer<typeof updateUserSchema>;

export type Author = {
  clerkId:   string;
  firstName: string;
  lastName:  string;
  imageUrl:  string;
  username:  string;
};

export type User = {
  _id:                string | Types.ObjectId;
  clerkId:            string;
  email:              string;
  username:           string;
  firstName:          string;
  lastName:           string;
  imageUrl:           string;
  bio?:               string;
  techStack:          string[];
  githubUrl?:         string;
  portfolioUrl?:      string;
  availableForCollab: boolean;
  createdAt:          string;
  updatedAt:          string;
};