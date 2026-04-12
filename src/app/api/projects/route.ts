import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Project, User } from "@/models";
import { createProjectSchema } from "@/lib/validations";
import { broadcast } from "@/lib/sse/connections";
import { ok, fail } from "@/lib/response/response";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();  
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page      = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit     = Math.min(20, Number(searchParams.get("limit") ?? 10));
    const stage     = searchParams.get("stage");
    const completed = searchParams.get("completed");
    const mine      = searchParams.get("mine") === "true";  

    if (mine && !userId) return fail("Unauthorised", "GET /api/projects", undefined, 401);  

    const filter: Record<string, unknown> = {};
    if (mine)               filter.authorId    = userId;         
    if (stage)              filter.stage       = stage;
    if (completed !== null) filter.isCompleted = completed === "true";

    const [projects, total] = await Promise.all([
      Project.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Project.countDocuments(filter),
    ]);

    const authorIds = [...new Set(projects.map((p) => p.authorId))];
    const authors   = await User.find({ clerkId: { $in: authorIds } })
      .select("clerkId firstName lastName imageUrl username")
      .lean();

    const authorMap = Object.fromEntries(authors.map((a) => [a.clerkId, a]));
    const enriched  = projects.map((p) => ({ ...p, author: authorMap[p.authorId] ?? null }));

    return ok("GET /api/projects", { projects: enriched, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return fail((error as Error).message, "GET /api/projects", undefined, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return fail("Unauthorised", "POST /api/projects", undefined, 401);

    const body   = await req.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.create({ ...parsed.data, authorId: userId });
    const author  = await User.findOne({ clerkId: userId })
      .select("clerkId firstName lastName imageUrl username")
      .lean();

    const payload = { ...project.toObject(), author };
    
    broadcast("new_project", payload);

    return ok("POST /api/projects", payload, userId, 201);
  } catch (error) {
    return fail((error as Error).message, "POST /api/projects", undefined, 500);
  }
}