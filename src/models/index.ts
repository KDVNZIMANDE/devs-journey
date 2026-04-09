import mongoose, { Schema, Document, model, models } from "mongoose";

// ─── User ────────────────────────────────────────────────────────────────────

export interface IUser extends Document {
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
  createdAt:          Date;
  updatedAt:          Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId:            { type: String, required: true, unique: true, index: true },
    email:              { type: String, default: "" },
    username:           { type: String, required: true, unique: true, index: true },
    firstName:          { type: String, required: true },
    lastName:           { type: String, required: true },
    imageUrl:           { type: String, default: "" },
    bio:                { type: String, maxlength: 300 },
    techStack:          { type: [String], default: [] },
    githubUrl:          { type: String, default: "" },
    portfolioUrl:       { type: String, default: "" },
    availableForCollab: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ─── Project ─────────────────────────────────────────────────────────────────

export interface IProject extends Document {
  authorId:          string;
  title:             string;
  description:       string;
  stage:             "idea" | "planning" | "building" | "testing" | "launched";
  supportNeeded:     string[];
  techStack:         string[];
  repoUrl?:          string;
  demoUrl?:          string;
  targetLaunchDate?: Date;
  isCompleted:       boolean;
  completedAt?:      Date;
  viewCount:         number;
  createdAt:         Date;
  updatedAt:         Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    authorId:          { type: String, required: true, index: true },
    title:             { type: String, required: true, maxlength: 100 },
    description:       { type: String, required: true, maxlength: 1000 },
    stage:             { type: String, enum: ["idea", "planning", "building", "testing", "launched"], required: true },
    supportNeeded:     { type: [String], default: [] },
    techStack:         { type: [String], default: [] },
    repoUrl:           { type: String, default: "" },
    demoUrl:           { type: String, default: "" },
    targetLaunchDate:  { type: Date },
    isCompleted:       { type: Boolean, default: false, index: true },
    completedAt:       { type: Date },
    viewCount:         { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ─── Milestone ───────────────────────────────────────────────────────────────

export interface IMilestone extends Document {
  projectId:    mongoose.Types.ObjectId;
  authorId:     string;
  title:        string;
  description?: string;
  createdAt:    Date;
}

const MilestoneSchema = new Schema<IMilestone>(
  {
    projectId:   { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    authorId:    { type: String, required: true },
    title:       { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// ─── Comment ──────────────────────────────────────────────────────────────────

export interface IComment extends Document {
  projectId: mongoose.Types.ObjectId;
  authorId:  string;
  content:   string;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    authorId:  { type: String, required: true },
    content:   { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

// ─── Safe exports (Next.js hot-reload guard) ─────────────────────────────────

export const User      = models.User      || model<IUser>("User", UserSchema);
export const Project   = models.Project   || model<IProject>("Project", ProjectSchema);
export const Milestone = models.Milestone || model<IMilestone>("Milestone", MilestoneSchema);
export const Comment   = models.Comment   || model<IComment>("Comment", CommentSchema);