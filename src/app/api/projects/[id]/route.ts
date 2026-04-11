import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Project, User } from "@/models";
import { updateProjectSchema } from "@/lib/validations";
import { broadcast } from "@/lib/sse/connections";
import { ok, fail } from "@/lib/response/response";

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

    if (!project) return fail("Project not found", "GET /api/projects/[id]", undefined, 404);

    const author = await User.findOne({ clerkId: project.authorId })
      .select("clerkId firstName lastName imageUrl username")
      .lean();

    return ok("GET /api/projects/[id]", { ...project, author });
  } catch (error) {
    return fail((error as Error).message, "GET /api/projects/[id]", undefined, 500);
  }
}

/**
 * PATCH /api/projects/[id]
 * Updates a project. Only the author can update their own project.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return fail("Unauthorised", "PATCH /api/projects/[id]", undefined, 401);

    const { id } = await params;
    const body   = await req.json();
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return fail(
        parsed.error.flatten().fieldErrors
          ? JSON.stringify(parsed.error.flatten().fieldErrors)
          : "Validation failed",
        "PATCH /api/projects/[id]",
        userId,
        400
      );
    }

    await connectDB();

    const project = await Project.findById(id);
    if (!project) return fail("Project not found", "PATCH /api/projects/[id]", userId, 404);
    if (project.authorId !== userId) return fail("Forbidden", "PATCH /api/projects/[id]", userId, 403);

    Object.assign(project, parsed.data);
    await project.save();

    broadcast("project_updated", project.toObject());

    return ok("PATCH /api/projects/[id]", project.toObject(), userId);
  } catch (error) {
    return fail((error as Error).message, "PATCH /api/projects/[id]", undefined, 500);
  }
}

/**
 * DELETE /api/projects/[id]
 * Marks a project as completed and adds the developer to the celebration wall.
 * Only the author can complete their own project.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return fail("Unauthorised", "DELETE /api/projects/[id]", undefined, 401);

    const { id } = await params;
    await connectDB();

    const project = await Project.findById(id);
    if (!project) return fail("Project not found", "DELETE /api/projects/[id]", userId, 404);
    if (project.authorId !== userId) return fail("Forbidden", "DELETE /api/projects/[id]", userId, 403);

    project.isCompleted = true;
    project.completedAt = new Date();
    project.stage       = "launched";
    await project.save();

    broadcast("project_completed", project.toObject());

    return ok("DELETE /api/projects/[id]", project.toObject(), userId);
  } catch (error) {
    return fail((error as Error).message, "DELETE /api/projects/[id]", undefined, 500);
  }
}