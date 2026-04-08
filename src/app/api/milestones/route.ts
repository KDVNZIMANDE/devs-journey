import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Milestone, Project } from "@/models";
import { createMilestoneSchema } from "@/lib/validations";
import { broadcast } from "@/lib/sse/connections";

/**
 * GET /api/milestones?projectId=xxx
 * Returns all milestones for a given project, newest first.
 */
export async function GET(req: NextRequest) {
  try {
    const projectId = new URL(req.url).searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    await connectDB();
    const milestones = await Milestone.find({ projectId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ milestones });
  } catch (error) {
    console.error("[GET /api/milestones]", error);
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 });
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
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createMilestoneSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify the user owns the project
    const project = await Project.findById(parsed.data.projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const milestone = await Milestone.create({
      ...parsed.data,
      authorId: userId,
    });

    broadcast("new_milestone", { milestone: milestone.toObject(), projectTitle: project.title });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error("[POST /api/milestones]", error);
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 });
  }
}
