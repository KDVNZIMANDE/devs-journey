import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models";
import { ok, fail } from "@/lib/response/response";
import { createUserSchema } from "@/types";

/**
 * GET /api/user
 * Returns the authenticated user's full profile from MongoDB.
 * Used by SessionContext on mount to populate userData.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return fail("Unauthorised", "GET /api/user", undefined, 401);

    await connectDB();

    const user = await User.findOne({ clerkId: userId }).lean();
    if (!user) return fail("User not found", "GET /api/user", userId, 404);

    return ok("GET /api/user", user, userId);
  } catch (error) {
    return fail((error as Error).message, "GET /api/user", undefined, 500);
  }
}

/**
 * POST /api/user
 * Called at the end of onboarding to create the user in MongoDB.
 * Until this is called the user is treated as unregistered by middleware.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return fail("Unauthorised", "POST /api/user", undefined, 401);

    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const user_email = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? "";

    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    // Guard against duplicate submissions
    const existing = await User.findOne({ clerkId: userId }).lean();
    if (existing) return ok("POST /api/user — already exists", existing, userId, 200);

    const usernameConflict = await User.findOne({ username: parsed.data.username }).lean();
    if (usernameConflict) return fail("Username already taken", "POST /api/user", userId, 409);

    const user = await User.create({
      clerkId:            userId,
      email:              user_email,
      firstName:          parsed.data.firstName,
      lastName:           parsed.data.lastName,
      username:           parsed.data.username,
      bio:                parsed.data.bio ?? "",
      githubUrl:          parsed.data.githubUrl ?? "",
      portfolioUrl:       parsed.data.portfolioUrl ?? "",
      techStack:          parsed.data.techStack ?? [],
      availableForCollab: parsed.data.availableForCollab ?? true,
    });

    return ok("POST /api/user", user.toObject(), userId, 201);
  } catch (error) {
    return fail((error as Error).message, "POST /api/user", undefined, 500);
  }
}

/**
 * PATCH /api/user
 * Updates the authenticated user's profile fields.
 * Used from the dashboard profile sidebar.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return fail("Unauthorised", "PATCH /api/user", undefined, 401);

    const body = await req.json();
    

    await connectDB();

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { $set: body },
      { new: true }
    ).lean();

    if (!user) return fail("User not found", "PATCH /api/user", userId, 404);

    return ok("PATCH /api/user", user, userId);
  } catch (error) {
    return fail((error as Error).message, "PATCH /api/user", undefined, 500);
  }
}