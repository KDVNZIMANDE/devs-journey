import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Milestone, Project } from "@/models";
import { createMilestoneSchema } from "@/lib/validations";
import { broadcast } from "@/lib/sse/connections";
import { ok, fail } from "@/lib/response/response";

/**
 * GET /api/milestones?projectId=xxx
 * Returns all milestones for a given project, newest first.
 */
export async function GET(req: NextRequest) {
  try {
    const projectId = new URL(req.url).searchParams.get("projectId");
    if (!projectId) return fail("projectId is required", "GET /api/milestones", undefined, 400);

    await connectDB();
    const milestones = await Milestone.find({ projectId }).sort({ createdAt: -1 }).lean();

    return ok("GET /api/milestones", milestones);
  } catch (error) {
    return fail((error as Error).message, "GET /api/milestones", undefined, 500);
  }
}

/**
 * POST /api/milestones
 * Adds a milestone to a project. Only the project author can add milestones.
 * Broadcasts a "new_milestone" SSE event to all connected clients.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return fail("Unauthorised", "POST /api/milestones", undefined, 401);

    const body   = await req.json();
    const parsed = createMilestoneSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        JSON.stringify(parsed.error.flatten().fieldErrors),
        "POST /api/milestones",
        userId,
        400
      );
    }

    await connectDB();

    const project = await Project.findById(parsed.data.projectId);
    if (!project)                    return fail("Project not found", "POST /api/milestones", userId, 404);
    if (project.authorId !== userId) return fail("Forbidden",        "POST /api/milestones", userId, 403);

    const milestone = await Milestone.create({ ...parsed.data, authorId: userId });

    broadcast("new_milestone", { milestone: milestone.toObject(), projectTitle: project.title });

    return ok("POST /api/milestones", milestone.toObject(), userId, 201);
  } catch (error) {
    return fail((error as Error).message, "POST /api/milestones", undefined, 500);
  }
}