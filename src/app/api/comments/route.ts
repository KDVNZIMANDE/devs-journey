import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Comment, User, Project } from "@/models";
import { createCommentSchema } from "@/lib/validations";
import { broadcast, sendToUser } from "@/lib/sse/connections";
import { ok, fail } from "@/lib/response/response";

/**
 * GET /api/comments?projectId=xxx
 * Returns all comments for a given project, oldest first.
 */
export async function GET(req: NextRequest) {
  try {
    const projectId = new URL(req.url).searchParams.get("projectId");
    if (!projectId) return fail("projectId is required", "GET /api/comments", undefined, 400);

    await connectDB();
    const comments = await Comment.find({ projectId }).sort({ createdAt: 1 }).lean();

    const authorIds = [...new Set(comments.map((c) => c.authorId))];
    const authors   = await User.find({ clerkId: { $in: authorIds } })
      .select("clerkId firstName lastName imageUrl username")
      .lean();

    const authorMap = Object.fromEntries(authors.map((a) => [a.clerkId, a]));
    const enriched  = comments.map((c) => ({ ...c, author: authorMap[c.authorId] ?? null }));

    return ok("GET /api/comments", enriched);
  } catch (error) {
    return fail((error as Error).message, "GET /api/comments", undefined, 500);
  }
}

/**
 * POST /api/comments
 * Posts a comment on a project.
 * Broadcasts to all clients AND sends a targeted notification to the project owner.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return fail("Unauthorised", "POST /api/comments", undefined, 401);

    const body   = await req.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        JSON.stringify(parsed.error.flatten().fieldErrors),
        "POST /api/comments",
        userId,
        400
      );
    }

    await connectDB();

    const project = await Project.findById(parsed.data.projectId);
    if (!project) return fail("Project not found", "POST /api/comments", userId, 404);

    const [comment, author] = await Promise.all([
      Comment.create({ ...parsed.data, authorId: userId }),
      User.findOne({ clerkId: userId })
        .select("clerkId firstName lastName imageUrl username")
        .lean(),
    ]);

    const payload = { ...comment.toObject(), author };

    broadcast("new_comment", payload);

    if (project.authorId !== userId) {
      sendToUser(project.authorId, "notification", {
        type:      "new_comment",
        message:   `${author?.firstName} commented on your project "${project.title}"`,
        projectId: project._id,
      });
    }

    return ok("POST /api/comments", payload, userId, 201);
  } catch (error) {
    return fail((error as Error).message, "POST /api/comments", undefined, 500);
  }
}