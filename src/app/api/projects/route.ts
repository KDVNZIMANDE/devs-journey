import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Project, User } from "@/models";
import { createProjectSchema } from "@/lib/validations";
import { broadcast } from "@/lib/sse/connections";

/**
 * GET /api/projects
 * Returns paginated list of projects for the live feed.
 * Supports filtering by stage and techStack via query params.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(20, Number(searchParams.get("limit") ?? 10));
    const stage = searchParams.get("stage");
    const completed = searchParams.get("completed");

    const filter: Record<string, unknown> = {};
    if (stage) filter.stage = stage;
    if (completed !== null) filter.isCompleted = completed === "true";

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter),
    ]);

    // Enrich with author info
    const authorIds = [...new Set(projects.map((p) => p.authorId))];
    const authors = await User.find({ clerkId: { $in: authorIds } })
      .select("clerkId firstName lastName imageUrl username")
      .lean();

    const authorMap = Object.fromEntries(authors.map((a) => [a.clerkId, a]));
    const enriched = projects.map((p) => ({
      ...p,
      author: authorMap[p.authorId] ?? null,
    }));

    return NextResponse.json({
      projects: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/projects]", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

/**
 * POST /api/projects
 * Creates a new project for the authenticated developer.
 * Broadcasts a "new_project" SSE event to all connected clients.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.create({
      ...parsed.data,
      authorId: userId,
    });

    const author = await User.findOne({ clerkId: userId })
      .select("clerkId firstName lastName imageUrl username")
      .lean();

    const payload = { ...project.toObject(), author };

    // Broadcast to all SSE-connected clients
    broadcast("new_project", payload);

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    console.error("[POST /api/projects]", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
