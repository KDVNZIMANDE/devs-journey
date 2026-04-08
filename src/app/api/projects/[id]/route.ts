import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Project, User } from "@/models";
import { updateProjectSchema } from "@/lib/validations";
import { broadcast } from "@/lib/sse/connections";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/projects/[id]
 * Returns a single project with author info. Increments view count.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();

    const project = await Project.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).lean();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const author = await User.findOne({ clerkId: project.authorId })
      .select("clerkId firstName lastName imageUrl username")
      .lean();

    return NextResponse.json({ ...project, author });
  } catch (error) {
    console.error("[GET /api/projects/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

/**
 * PATCH /api/projects/[id]
 * Updates a project. Only the author can update their own project.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    Object.assign(project, parsed.data);
    await project.save();

    broadcast("project_updated", project.toObject());

    return NextResponse.json(project);
  } catch (error) {
    console.error("[PATCH /api/projects/[id]]", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]
 * Marks a project as completed and adds the developer to the celebration wall.
 * Only the author can complete their own project.
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    project.isCompleted = true;
    project.completedAt = new Date();
    project.stage = "launched";
    await project.save();

    broadcast("project_completed", project.toObject());

    return NextResponse.json({ message: "Project marked as complete", project });
  } catch (error) {
    console.error("[DELETE /api/projects/[id]]", error);
    return NextResponse.json({ error: "Failed to complete project" }, { status: 500 });
  }
}
