import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Comment, User, Project } from "@/models";
import { createCommentSchema } from "@/lib/validations";
import { broadcast, sendToUser } from "@/lib/sse/connections";

/**
 * GET /api/comments?projectId=xxx
 * Returns all comments for a given project, oldest first.
 */
export async function GET(req: NextRequest) {
  try {
    const projectId = new URL(req.url).searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    await connectDB();
    const comments = await Comment.find({ projectId }).sort({ createdAt: 1 }).lean();

    const authorIds = [...new Set(comments.map((c) => c.authorId))];
    const authors = await User.find({ clerkId: { $in: authorIds } })
      .select("clerkId firstName lastName imageUrl username")
      .lean();

    const authorMap = Object.fromEntries(authors.map((a) => [a.clerkId, a]));
    const enriched = comments.map((c) => ({ ...c, author: authorMap[c.authorId] ?? null }));

    return NextResponse.json({ comments: enriched });
  } catch (error) {
    console.error("[GET /api/comments]", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
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
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.findById(parsed.data.projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const [comment, author] = await Promise.all([
      Comment.create({ ...parsed.data, authorId: userId }),
      User.findOne({ clerkId: userId }).select("clerkId firstName lastName imageUrl username").lean(),
    ]);

    const payload = { ...comment.toObject(), author };

    // Broadcast the new comment to all connected clients
    broadcast("new_comment", payload);

    // Notify the project owner if someone else commented
    if (project.authorId !== userId) {
      sendToUser(project.authorId, "notification", {
        type: "new_comment",
        message: `${author?.firstName} commented on your project "${project.title}"`,
        projectId: project._id,
      });
    }

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    console.error("[POST /api/comments]", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
